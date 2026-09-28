"""Bounded, non-executable artifact handling for the trusted Pages publisher."""
import json
from pathlib import Path
import re
import shutil
import stat
import unicodedata
import zipfile

MAX_GALLERY_BYTES = 128 * 1024 * 1024
MAX_FILES = 10_000
MAX_SITE_BYTES = 900 * 1024 * 1024
STATE = ".gallery-pages.json"


def extract_gallery(archive: Path, destination: Path) -> None:
    if destination.exists():
        raise ValueError("Extraction destination must not exist")
    with zipfile.ZipFile(archive) as source:
        infos = source.infolist()
        if len(infos) > MAX_FILES or sum(i.file_size for i in infos) > MAX_GALLERY_BYTES:
            raise ValueError("Gallery exceeds extraction limits")
        seen = set()
        files = set()
        for info in infos:
            name = info.filename.rstrip("/")
            parts = name.split("/")
            mode = stat.S_IFMT(info.external_attr >> 16)
            if (info.orig_filename != info.filename or not name or "\\" in name or any(ord(c) < 32 for c in name)
                    or any(not p or p.startswith(".") or ":" in p for p in parts)
                    or parts[0].casefold() in {"pr", "cname"}
                    or mode not in {0, stat.S_IFREG, stat.S_IFDIR}
                    or info.flag_bits & 1):
                raise ValueError("Unsafe gallery archive entry")
            key = unicodedata.normalize("NFC", name).casefold()
            if key in seen or any("/".join(key.split("/")[:i]) in files for i in range(1, len(parts))):
                raise ValueError("Ambiguous gallery archive path")
            if not info.is_dir() and any(k.startswith(key + "/") for k in seen):
                raise ValueError("File conflicts with archive directory")
            seen.add(key)
            if not info.is_dir():
                files.add(key)
        if not {"index.html", "preview.html"} <= {i.filename for i in infos if not i.is_dir()}:
            raise ValueError("Missing gallery entrypoints")
        destination.mkdir(parents=True)
        total = 0
        try:
            for info in infos:
                target = destination / info.filename
                if info.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                with source.open(info) as inp, target.open("xb") as out:
                    while chunk := inp.read(1024 * 1024):
                        total += len(chunk)
                        if total > MAX_GALLERY_BYTES:
                            raise ValueError("Gallery exceeds extraction limit")
                        out.write(chunk)
        except Exception:
            shutil.rmtree(destination)
            raise


def validate_site_size(root: Path) -> int:
    size = 0
    for path in root.rglob("*"):
        if path.is_symlink() or not (path.is_file() or path.is_dir()):
            raise ValueError("Site contains non-regular files")
        if path.is_file():
            size += path.stat().st_size
            if size > MAX_SITE_BYTES:
                raise ValueError("Pages site exceeds 900 MiB; remove closed previews first")
    return size


def compose_site(published: Path, output: Path, candidate: Path | None,
                 pr_number: int | None, remove_prs: set[int]) -> None:
    if output.exists():
        raise ValueError("Site output must not exist")
    if published.exists():
        shutil.copytree(published, output, ignore=shutil.ignore_patterns(".git", STATE))
    else:
        output.mkdir(parents=True)
    for number in remove_prs:
        if not isinstance(number, int) or number <= 0:
            raise ValueError("Invalid PR number")
        shutil.rmtree(output / "pr" / str(number), ignore_errors=True)
    if candidate is not None:
        if pr_number is None:
            for path in output.iterdir():
                if path.name == "pr":
                    continue
                shutil.rmtree(path) if path.is_dir() else path.unlink()
            shutil.copytree(candidate, output, dirs_exist_ok=True)
        else:
            if not isinstance(pr_number, int) or pr_number <= 0:
                raise ValueError("Invalid PR number")
            target = output / "pr" / str(pr_number)
            shutil.rmtree(target, ignore_errors=True)
            shutil.copytree(candidate, target)
    validate_site_size(output)


def empty_state(repository: str) -> dict:
    return dict(schema=1, repository=repository, published_commit=None, deployment_run=None,
                deployment_pending=False, main=None, previews={}, comments={}, requests={})


def read_state(root: Path, repository: str) -> dict:
    data = json.loads((root / STATE).read_text())
    if data["schema"] != 1 or data["repository"] != repository:
        raise ValueError("Foreign or unsupported Pages state")
    if type(data["deployment_pending"]) is not bool:
        raise ValueError("Invalid pending deployment state")
    pointer = data["published_commit"]
    if pointer is not None and not re.fullmatch("[a-f0-9]{40}", pointer):
        raise ValueError("Invalid published pointer")
    for number, entry in data["previews"].items():
        if not re.fullmatch(r"[1-9][0-9]*", number):
            raise ValueError("Invalid preview key")
    for entry in [data["main"], *data["previews"].values()]:
        if entry is None:
            continue
        if not re.fullmatch("[a-f0-9]{40}", entry["sha"]):
            raise ValueError("Invalid gallery commit")
        for field in ["run_id", "run_attempt", "artifact_id", "actor_id"]:
            if type(entry[field]) is not int or entry[field] <= 0:
                raise ValueError("Invalid gallery provenance")
        if entry["comment_id"] is not None and (type(entry["comment_id"]) is not int or entry["comment_id"] <= 0):
            raise ValueError("Invalid approval comment")
    for field in ["comments", "requests"]:
        if not isinstance(data[field], dict):
            raise ValueError("Invalid control state")
    return data


def write_state(root: Path, state: dict) -> None:
    (root / STATE).write_text(json.dumps(state, indent=2, sort_keys=True) + "\n")
