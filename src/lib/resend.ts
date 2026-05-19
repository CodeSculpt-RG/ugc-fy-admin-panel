export class Resend {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || "";
  }

  emails = {
    send: async (options: {
      from: string;
      to: string;
      subject: string;
      html: string;
    }): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> => {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(options),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.error) {
          return {
            data: null,
            error: {
              message: data.error?.message || `Resend API Error: HTTP ${response.status}`,
            },
          };
        }

        return {
          data: data as Record<string, unknown>,
          error: null,
        };
      } catch (err: unknown) {
        const errorRecord = err as Record<string, unknown>;
        return {
          data: null,
          error: {
            message: String(errorRecord.message || "Failed to trigger email fetch request."),
          },
        };
      }
    },
  };
}
