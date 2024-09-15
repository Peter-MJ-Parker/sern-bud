type EmojiData = {
  emoji: string;
  description: string;
  category: string;
  aliases: string[];
  tags: string[];
  unicode_version: string;
  ios_version: string;
};

const emojiRegex =
  /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}]/gu;

/**
 * Checks if a string consists only of emoji characters.
 * @param str The string to check
 * @returns True if the string contains only emoji, false otherwise
 */
export function onlyEmoji(str: string): boolean {
  const strippedStr = str.replace(/\s/g, '');
  const emojiMatches = strippedStr.match(emojiRegex);
  return emojiMatches !== null && emojiMatches.join('') === strippedStr;
}

/**
 * Extracts all emoji from a given string.
 * @param str The string to extract emoji from
 * @returns An array of emoji found in the string
 */
export function extractEmoji(str: string): string[] {
  return str.match(emojiRegex) || [];
}

/**
 * Counts the number of emoji in a string.
 * @param str The string to count emoji in
 * @returns The number of emoji found
 */
export function countEmoji(str: string): number {
  return extractEmoji(str).length;
}

/**
 * Removes all emoji from a string.
 * @param str The string to remove emoji from
 * @returns The string with all emoji removed
 */
export function stripEmoji(str: string): string {
  return str.replace(emojiRegex, '');
}

// Note: This is a mock function. In a real implementation, you'd need a comprehensive
// database of emoji data, which is beyond the scope of this example.
export function getEmojiInfo(emoji: string): EmojiData | null {
  // This would typically involve looking up the emoji in a database
  // For this example, we'll just return a mock object for the 😀 emoji
  if (emoji === '😀') {
    return {
      emoji: '😀',
      description: 'grinning face',
      category: 'Smileys & Emotion',
      aliases: ['grinning'],
      tags: ['smile', 'happy'],
      unicode_version: '6.1',
      ios_version: '6.0'
    };
  }
  return null;
}
