import * as fs from "fs";
import * as path from "path";

import { Word } from "../Types/Word";

export class DictionaryService {
    _dictionary: Word[];

    constructor() {
        this._readDictionary();
    }

    _readDictionary(pathToFile?: string) {
        // TODO JMR - Add logic to run the parser if the dictionary isn't built yet.
        fs.readFile(
            pathToFile ? pathToFile : path.join(__dirname, "..", "..", "data", "dictionary.json"),
            { encoding: "utf-8" }, this._parseDictionaryContents.bind(this)
        );
    }

    _parseDictionaryContents(err: NodeJS.ErrnoException, data: string) {
        this._dictionary = JSON.parse(data);
        console.log(this._dictionary);
    }
}
