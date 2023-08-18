export class Markdown {
  public static bold(text: string) {
    return `**${text}**`;
  }

  public static italic(text: string) {
    return `*${text}*`;
  }

  public static underline(text: string) {
    return `__${text}__`;
  }

  public static strikethrough(text: string) {
    return `~~${text}~~`;
  }

  public static codeBlock(text: string, language?: string) {
    return `\`\`\`${language ?? ""}\n${text}\n\`\`\``;
  }

  public static quote(text: string) {
    return `> ${text}`;
  }

  public static link(text: string, url: string) {
    return `[${text}](${url})`;
  }

  public static inlineCode(text: string) {
    return `\`${text}\``;
  }
}
