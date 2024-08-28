import { R2Bucket } from "@cloudflare/workers-types";
import { LogEntry } from "../types";

/**
 * Logging system to track and store bot actions in Cloudflare R2.
 */
class Logger {
  private r2Bucket?: R2Bucket; // Make r2Bucket optional
  private logKeyPrefix: string = "logs/";

  constructor(r2Bucket?: R2Bucket) {
    this.r2Bucket = r2Bucket;
  }

  /**
   * Generates a unique key for each log entry based on the current timestamp.
   * @returns {string} - The key to use when storing the log entry in R2.
   */
  private generateLogKey(): string {
    const timestamp = new Date().toISOString();
    return `${this.logKeyPrefix}${timestamp}.json`;
  }

  /**
   * Saves a log entry to the R2 bucket.
   * If the R2 bucket is not available, this method will exit without doing anything.
   * @param {string} action - The action name to log.
   * @param {any} [details] - Any additional details to store with the log.
   * @returns {Promise<void>} - A promise that resolves when the log is saved.
   */
  public async saveLog(action: string, details?: any): Promise<void> {
    if (!this.r2Bucket) {
      console.warn("R2 bucket is not defined. Log entry not saved.");
      return;
    }

    try {
      const logEntry: LogEntry = {
        action,
        timestamp: new Date().toISOString(),
        details,
      };

      const logKey = this.generateLogKey();
      await this.r2Bucket.put(logKey, JSON.stringify(logEntry));
    } catch (error) {
      console.error(`Failed to save log entry for action: ${action}`, error);
    }
  }

  /**
   * Retrieves log entries from the R2 bucket.
   * If the R2 bucket is not available, this method will return an empty array.
   * @param {string} [prefix] - An optional prefix to filter log entries (e.g., specific actions).
   * @returns {Promise<LogEntry[]>} - A promise that resolves to an array of log entries.
   */
  public async getLogs(prefix?: string): Promise<LogEntry[]> {
    if (!this.r2Bucket) {
      console.warn("R2 bucket is not defined. Returning an empty log list.");
      return [];
    }

    try {
      const logs: LogEntry[] = [];
      const options = prefix
        ? { prefix: `${this.logKeyPrefix}${prefix}` }
        : { prefix: this.logKeyPrefix };
      const objects = await this.r2Bucket.list(options);

      for (const object of objects.objects) {
        const logData = await this.r2Bucket.get(object.key);
        if (logData) {
          const logText = await logData.text();
          logs.push(JSON.parse(logText));
        }
      }

      return logs;
    } catch (error) {
      console.error("Failed to retrieve logs", error);
      return [];
    }
  }

  /**
   * Generates a JSON array of logs filtered by a specific action and time range.
   * If the R2 bucket is not available, this method will return an empty array.
   * @param {string} action - The action to filter logs by.
   * @param {Date} startDate - The start of the time range.
   * @param {Date} endDate - The end of the time range.
   * @returns {Promise<LogEntry[]>} - A promise that resolves to an array of log entries.
   */
  public async getLogsByActionAndDateRange(
    action: string,
    startDate: Date,
    endDate: Date
  ): Promise<LogEntry[]> {
    if (!this.r2Bucket) {
      console.warn("R2 bucket is not defined. Returning an empty log list.");
      return [];
    }

    const allLogs = await this.getLogs(action);
    return allLogs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  /**
   * Example usage: Generates a JSON array of online users per week for graphing purposes.
   * If the R2 bucket is not available, this method will return an empty array.
   * @param {Date} startDate - The start of the week.
   * @param {Date} endDate - The end of the week.
   * @returns {Promise<any[]>} - A promise that resolves to a JSON array of online user data.
   */
  public async generateOnlineUsersReport(
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    if (!this.r2Bucket) {
      console.warn("R2 bucket is not defined. Returning an empty report.");
      return [];
    }

    const logs = await this.getLogsByActionAndDateRange(
      "new_conversation",
      startDate,
      endDate
    );
    const onlineUsers: any[] = logs.map((log) => ({
      timestamp: log.timestamp,
    }));

    return onlineUsers;
  }

  /**
   * Example usage: Generates chart data for online users per week.
   * If the R2 bucket is not available, this method will return empty labels and data.
   * @param {Date} startDate - The start of the week.
   * @param {Date} endDate - The end of the week.
   * @returns {Promise<{ labels: string[], data: number[] }>} - A promise that resolves to an object with labels and data for graphing.
   */
  public async generateOnlineUsersChartData(
    startDate: Date,
    endDate: Date
  ): Promise<{ labels: string[]; data: number[] }> {
    if (!this.r2Bucket) {
      console.warn("R2 bucket is not defined. Returning empty chart data.");
      return { labels: [], data: [] };
    }

    const logs = await this.generateOnlineUsersReport(startDate, endDate);

    // Group by day and count online users
    const chartData: { [key: string]: number } = {};
    logs.forEach((log) => {
      const day = log.timestamp.split("T")[0]; // Get only the date part
      chartData[day] = (chartData[day] || 0) + 1;
    });

    const labels = Object.keys(chartData);
    const data = Object.values(chartData);

    return { labels, data };
  }
}

export default Logger;
