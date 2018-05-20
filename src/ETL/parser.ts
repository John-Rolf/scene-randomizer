import * as fs from "fs";
import * as path from "path";

import { Word } from "../Types/Word";

const words: Word[] = [];

const definitionStartPattern = /[1-9]+?\.|\([a-z]\)|Defn:/;
const notEmptySpacePattern = /\S/;

export function parse(pathToFile: string) {
    fs.readFile(pathToFile, { encoding: "utf-8" }, _readFileCallback);
}

function _readFileCallback(err: NodeJS.ErrnoException, data: string) {
    if (err) {
        console.error(err);
        return;
    }

    const lines = data.split("\n");

    // CQ JMR 04/19/18 - Less than ideal. Fix later
    let start, end;
    lines.forEach((line, index) => {
        if (line === "*** START OF THIS PROJECT GUTENBERG EBOOK WEBSTER'S UNABRIDGED DICTIONARY ***") { start = index; }
        else if (line === "*** END OF THIS PROJECT GUTENBERG EBOOK WEBSTER'S UNABRIDGED DICTIONARY ***") { end = index; }
    });

    const wordLines = lines.slice(start + 1, end);

    let currentWord: Word;
    let currentDefinition: string;
    let alternates: string[];
    let partOfSpeechAndEtymology: string;

    let lastLineWasNewWord: boolean;

    // JMR CQ - Consider extracting this fat arrow out to be tested more independently.
    wordLines.forEach((wordLine, index) => {
        // Next word entry
        if (wordLine.toUpperCase() === wordLine) {
            const lastLineContainsNonWhitespaceCharacters: boolean = wordLines[index - 1] ?
                notEmptySpacePattern.test(wordLines[index - 1]) : false;

            if (!lastLineContainsNonWhitespaceCharacters) {
                if (currentWord && currentWord.word) {
                    words.push(currentWord);
                    alternates.forEach((alternate) => {
                        words.push({...currentWord, word: alternate});
                    });
                }
                const alternateSpellings = wordLine.split("; ");
                currentWord = { word: alternateSpellings[0], definitions: [] };
                alternates = alternateSpellings.slice(1);
                lastLineWasNewWord = true;
                return;
            }
        }
        if (lastLineWasNewWord) {
            partOfSpeechAndEtymology = wordLine;
            lastLineWasNewWord = false;
            return;
        }
        lastLineWasNewWord = false;

        // Empty Line
        if (!notEmptySpacePattern.test(wordLine)) {
            if (currentWord) {
                if (currentDefinition) {
                    currentWord.definitions.push(currentDefinition);
                    currentDefinition = null;
                    return;
                }
                if (partOfSpeechAndEtymology) {
                    currentWord.details = partOfSpeechAndEtymology;
                    partOfSpeechAndEtymology = null;
                    return;
                }
            }
        }

        // Continuation of the part of speech declaration
        if (partOfSpeechAndEtymology) {
            partOfSpeechAndEtymology += wordLine;
        }

        // Start of new definition
        const match = definitionStartPattern.exec(wordLine);
        if (match && match.index === 0) {
            currentDefinition = wordLine;
            return;
        }

        // Continuation of a previous definition
        if (currentDefinition) {
            currentDefinition += wordLine;
        }
    });
    fs.writeFile(path.join(__dirname, "..", "..", "data", "dictionary.json"), JSON.stringify(words), writeCallback);
}

function writeCallback(err: NodeJS.ErrnoException) {
    if (err) {console.error(err); }
}

parse(path.join(__dirname, "..", "..", "WebstersUnabridgedDictionary.txt"));
