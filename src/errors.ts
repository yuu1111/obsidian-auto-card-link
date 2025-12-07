/**
 * @fileoverview Custom error classes for the Auto Card Link plugin.
 * @module errors
 */

/**
 * Error thrown when YAML parsing fails.
 * @extends Error
 */
export class YamlParseError extends Error {}

/**
 * Error thrown when required parameters are missing from the cardlink code block.
 * @extends Error
 */
export class NoRequiredParamsError extends Error {}
