import type { MetaMaskStateLog } from "@/types/state-log";

/**
 * Attempts to parse a .txt file from iPhone MetaMask state logs
 * and convert it to a properly formatted JSON object
 */
export function parseTextStateLog(text: string): MetaMaskStateLog {
  // Remove any leading/trailing whitespace
  let cleanedText = text.trim();

  // Remove BOM (Byte Order Mark) if present
  if (cleanedText.charCodeAt(0) === 0xFEFF) {
    cleanedText = cleanedText.slice(1);
  }

  // Remove any content before the first { and after the last }
  const jsonStart = cleanedText.indexOf('{');
  const jsonEnd = cleanedText.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON content found in the text file. Please ensure this is a MetaMask state log file.');
  }

  // Extract just the JSON part
  const jsonText = cleanedText.substring(jsonStart, jsonEnd + 1);

  // Common text cleanup operations for iPhone downloads
  const processedText = jsonText
    // Remove any null bytes or invisible characters
    .replace(/\0/g, '')
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '')

    // Fix common formatting issues from copy-paste or file conversion
    .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
    .replace(/,\s*]/g, ']') // Remove trailing commas before closing brackets

    // Fix different quote styles that might come from iPhone text conversion
    .replace(/[""]/g, '"') // Replace smart quotes with regular quotes
    .replace(/['']/g, "'") // Replace smart single quotes

    // Fix broken line endings that might affect parsing
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Try to parse the cleaned JSON
  try {
    const parsed = JSON.parse(processedText);
    return parsed as MetaMaskStateLog;
  } catch (firstError) {
    // If parsing fails, try additional cleanup strategies
    console.log('First parse attempt failed, trying additional cleanup strategies...');

    // Strategy 2: Try to fix common JSON syntax errors
    try {
      const fixedText = processedText
        // Fix missing quotes around object keys (common issue in iPhone exports)
        .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')

        // Fix single quotes to double quotes
        .replace(/'/g, '"')

        // Fix JavaScript literals that aren't valid JSON
        .replace(/:\s*undefined/g, ':null')
        .replace(/:\s*NaN/g, ':null')
        .replace(/:\s*Infinity/g, ':null')
        .replace(/:\s*-Infinity/g, ':null')

        // Fix trailing commas more aggressively
        .replace(/,(\s*[}\]])/g, '$1')

        // Remove any comments that might be present
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');

      const parsed = JSON.parse(fixedText);
      return parsed as MetaMaskStateLog;
    } catch (secondError) {
      // Strategy 3: Try to handle multiline strings and other edge cases
      try {
        const robustText = processedText
          // Handle multiline strings by escaping newlines within strings
          .replace(/"([^"]*?)\n([^"]*?)"/g, '"$1\\n$2"')

          // Remove any remaining invalid characters (keep only printable ASCII + newlines)
          .replace(/[^\x20-\x7E\n]/g, '')

          // Fix hex values that might be malformed
          .replace(/"(0x[0-9a-fA-F]+)"/g, '"$1"')

          // Normalize whitespace
          .replace(/\s+/g, ' ')
          .replace(/\s*([{}[\]:,])\s*/g, '$1')

          // Final trailing comma cleanup
          .replace(/,(\s*[}\]])/g, '$1');

        const parsed = JSON.parse(robustText);
        return parsed as MetaMaskStateLog;
      } catch (thirdError) {
        // Strategy 4: Try to extract JSON using a more forgiving approach
        try {
          // Last resort: try to build a valid JSON by extracting recognizable patterns
          const lines = processedText.split('\n');
          const validLines = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
          });

          const reconstructedJson = validLines.join('\n')
            .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
            .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":') // Quote keys
            .replace(/'/g, '"'); // Fix quotes

          const parsed = JSON.parse(reconstructedJson);
          return parsed as MetaMaskStateLog;
        } catch (fourthError) {
          // If all strategies fail, provide helpful error information
          console.error('All parsing strategies failed:', {
            firstError: firstError instanceof Error ? firstError.message : String(firstError),
            secondError: secondError instanceof Error ? secondError.message : String(secondError),
            thirdError: thirdError instanceof Error ? thirdError.message : String(thirdError),
            fourthError: fourthError instanceof Error ? fourthError.message : String(fourthError),
            textSample: `${processedText.substring(0, 300)}...`,
            textLength: processedText.length
          });

          throw new Error(
            `Unable to parse .txt file as valid JSON. This might be a corrupted or incompatible file format. Common issues:
• File may not be a MetaMask state log
• Text encoding issues during download
• Corrupted JSON structure

Original error: ${firstError instanceof Error ? firstError.message : String(firstError)}`
          );
        }
      }
    }
  }
}

/**
 * Detects if a string contains JSON content that could be a state log
 */
export function isLikelyStateLogText(text: string): boolean {
  const trimmedText = text.trim();

  // Remove BOM if present
  const cleanText = trimmedText.charCodeAt(0) === 0xFEFF ? trimmedText.slice(1) : trimmedText;

  // Check if it contains JSON structure
  const hasJsonStart = cleanText.includes('{');
  const hasJsonEnd = cleanText.includes('}');

  if (!hasJsonStart || !hasJsonEnd) {
    return false;
  }

  // Check for common MetaMask state log properties (case-insensitive)
  const commonKeys = [
    'metamask',
    'engine',
    'submittedTime',
    'transactions',
    'backgroundState',
    'NetworkController',
    'TransactionController',
    'AccountTrackerController',
    'PreferencesController'
  ];

  const lowerCaseText = cleanText.toLowerCase();
  const foundKeys = commonKeys.filter(key =>
    lowerCaseText.includes(`"${key.toLowerCase()}"`) ||
    lowerCaseText.includes(`${key.toLowerCase()}:`)
  );

  // If we find at least 2 common keys, it's likely a state log
  return foundKeys.length >= 2;
}

/**
 * Detects the file type and returns appropriate parser strategy
 */
export function getFileParsingStrategy(filename: string, content: string): 'json' | 'txt' | 'unknown' {
  const lowercaseFilename = filename.toLowerCase();
  const trimmedContent = content.trim();

  // Check file extension first
  if (lowercaseFilename.endsWith('.json')) {
    return 'json';
  }

  if (lowercaseFilename.endsWith('.txt')) {
    // Verify it looks like a state log
    if (isLikelyStateLogText(content)) {
      return 'txt';
    }
  }

  // Check content regardless of extension
  if (isLikelyStateLogText(content)) {
    // If it looks like clean JSON, use JSON parser
    if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) {
      try {
        JSON.parse(trimmedContent);
        return 'json';
      } catch {
        // If JSON parsing fails, use txt parser for cleanup
        return 'txt';
      }
    }
    // If it contains JSON but has extra content, use txt parser
    return 'txt';
  }

  return 'unknown';
}

/**
 * Validates that a parsed object looks like a MetaMask state log
 */
export function validateStateLog(data: unknown): data is MetaMaskStateLog {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Check for either desktop format (metamask property) or mobile format (engine property)
  const hasDesktopFormat = Boolean(obj.metamask && typeof obj.metamask === 'object');
  const hasMobileFormat = Boolean(obj.engine && typeof obj.engine === 'object');

  // Check for common mobile properties at root level
  const hasMobileProps = Boolean(
    obj.submittedTime ||
    obj.seedphraseBackedUp !== undefined ||
    obj.automaticSecurityChecksEnabled !== undefined
  );

  return hasDesktopFormat || hasMobileFormat || hasMobileProps;
}
