import { Context } from "telegraf";
import { logError } from "./logError";

export interface FileLinkTask {
  fileId: string;
  ctx: Context;
  messageId: number;
  chatId: number;
}

class FileLinkQueue {
  private queue: FileLinkTask[] = [];
  private activeRequests: Set<string> = new Set();
  private readonly MAX_CONCURRENT = 3;

  /**
   * Add a task to get file link to the queue
   */
  enqueue(task: FileLinkTask): void {
    this.queue.push(task);
    this.processQueue();
  }

  /**
   * Process the queue, getting file links if slots are available
   */
  private async processQueue(): Promise<void> {
    // Check if we can start more requests
    while (
      this.activeRequests.size < this.MAX_CONCURRENT &&
      this.queue.length > 0
    ) {
      const task = this.queue.shift();
      if (!task) break;

      // Create unique identifier for this request
      const taskId = `${task.chatId}_${task.messageId}`;
      this.activeRequests.add(taskId);

      // Start getting file link asynchronously
      this.getFileLinkTask(task, taskId).catch((error) => {
        logError(error);
        this.activeRequests.delete(taskId);
        this.processQueue(); // Continue processing queue
      });
    }
  }

  /**
   * Get file link for a single task
   */
  private async getFileLinkTask(
    task: FileLinkTask,
    taskId: string,
  ): Promise<void> {
    try {
      // Get direct link to the file
      const fileLink = await task.ctx.telegram.getFileLink(task.fileId);
      const linkUrl = fileLink.toString();

      // Reply with the file link
      await task.ctx.telegram.sendMessage(
        task.chatId,
        `готово\n\n${linkUrl}`,
        { reply_parameters: { message_id: task.messageId } },
      );
    } catch (error) {
      logError(error);
      // Try to send error message to user
      try {
        let errorMessage = "Ошибка при получении ссылки на файл";
        if (error instanceof Error) {
          if (error.message.includes("too big")) {
            errorMessage = "Файл слишком большой (больше 20MB). Telegram Bot API не поддерживает получение ссылок на файлы больше 20MB.";
          } else {
            errorMessage = `Ошибка при получении ссылки на файл: ${error.message}`;
          }
        }
        await task.ctx.telegram.sendMessage(
          task.chatId,
          errorMessage,
          { reply_parameters: { message_id: task.messageId } },
        );
      } catch (replyError) {
        logError(replyError);
      }
    } finally {
      // Remove from active requests and process next task
      this.activeRequests.delete(taskId);
      this.processQueue();
    }
  }

  /**
   * Get current queue status (for debugging)
   */
  getStatus(): { queueLength: number; activeRequests: number } {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests.size,
    };
  }
}

// Export singleton instance
export const fileLinkQueue = new FileLinkQueue();
