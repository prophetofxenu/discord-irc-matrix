import ircFormatting from 'irc-formatting';
import SimpleMarkdown from 'simple-markdown';
import colors from 'irc-colors';

function mdNodeToIRC(node) {
  let { content } = node;
  if (Array.isArray(content)) content = content.map(mdNodeToIRC).join('');
  switch (node.type) {
    case 'em':
      return colors.italic(content);
    case 'strong':
      return colors.bold(content);
    case 'u':
      return colors.underline(content);
    default:
      return content;
  }
}

function mdNodeToMatrix(node) {
  let { content } = node;
  if (Array.isArray(content)) content = content.map(mdNodeToMatrix).join('');
  switch (node.type) {
    case 'em':
      return `<em>${content}</em>`;
    case 'strong':
      return `<b>${content}</b>`;
    case 'u':
      return `<u>${content}</u>`;
    default:
      return content;
  }
}

export function formatFromDiscordToIRC(text) {
  const markdownAST = SimpleMarkdown.defaultInlineParse(text);
  return markdownAST.map(mdNodeToIRC).join('');
}

export function formatFromDiscordToMatrix(text) {
  const markdownAST = SimpleMarkdown.defaultInlineParse(text);
  return markdownAST.map(mdNodeToMatrix).join('');
}

export function formatFromIRCToDiscord(text) {
  const blocks = ircFormatting.parse(text).map(block => ({
    // Consider reverse as italic, some IRC clients use that
    ...block,
    italic: block.italic || block.reverse
  }));
  let mdText = '';

  for (let i = 0; i <= blocks.length; i += 1) {
    // Default to unstyled blocks when index out of range
    const block = blocks[i] || {};
    const prevBlock = blocks[i - 1] || {};

    // Add start markers when style turns from false to true
    if (!prevBlock.italic && block.italic) mdText += '*';
    if (!prevBlock.bold && block.bold) mdText += '**';
    if (!prevBlock.underline && block.underline) mdText += '__';

    // Add end markers when style turns from true to false
    // (and apply in reverse order to maintain nesting)
    if (prevBlock.underline && !block.underline) mdText += '__';
    if (prevBlock.bold && !block.bold) mdText += '**';
    if (prevBlock.italic && !block.italic) mdText += '*';

    mdText += block.text || '';
  }

  return mdText;
}

export function formatFromIRCToMatrix(text) {
  // :)
  return formatFromDiscordToMatrix(formatFromIRCToDiscord(text));
}

export function formatFromMatrixToDiscord(text) {
  let formatted = text.replace(/<\/?u>/g, '__');
  formatted = text.replace(/<\/?b>/g, '**');
  formatted = formatted.replace(/<\/?del>/g, '~~');
  return formatted;
}

export function formatFromMatrixToIRC(text) {
  let formatted = text.replace(/<\/?u>/g, '__');
  formatted = text.replace(/<\/?b>/g, '**');
  formatted = formatted.replace(/<\/?del>/g, '~~');
  const markdownAST = SimpleMarkdown.defaultInlineParse(formatted);
  return markdownAST.map(mdNodeToIRC).join('');
}
