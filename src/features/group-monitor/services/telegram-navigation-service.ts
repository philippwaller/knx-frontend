import type { TelegramRow } from "../types/telegram-row";

/**
 * Service responsible for navigation through telegram list
 */
export class TelegramNavigationService {
  private _selectedTelegramId: string | null = null;

  /**
   * Gets the currently selected telegram ID
   */
  public get selectedTelegramId(): string | null {
    return this._selectedTelegramId;
  }

  /**
   * Sets the currently selected telegram ID
   */
  public set selectedTelegramId(value: string | null) {
    this._selectedTelegramId = value;
  }

  /**
   * Navigates through the filtered telegram list
   */
  public navigateTelegram(step: number, filteredRows: TelegramRow[]): string | null {
    if (!this._selectedTelegramId) return null;

    const currentIndex = filteredRows.findIndex((row) => row.id === this._selectedTelegramId);
    const targetIndex = currentIndex + step;

    if (targetIndex >= 0 && targetIndex < filteredRows.length) {
      this._selectedTelegramId = filteredRows[targetIndex].id;
      return this._selectedTelegramId;
    }

    return null;
  }

  /**
   * Selects the next telegram in the filtered list
   */
  public selectNextTelegram(filteredTelegrams: TelegramRow[]): string | null {
    return this.navigateTelegram(1, filteredTelegrams);
  }

  /**
   * Selects the previous telegram in the filtered list
   */
  public selectPreviousTelegram(filteredTelegrams: TelegramRow[]): string | null {
    return this.navigateTelegram(-1, filteredTelegrams);
  }

  /**
   * Clears the selection
   */
  public clearSelection(): void {
    this._selectedTelegramId = null;
  }
}
