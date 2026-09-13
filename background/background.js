const DICTIONARY_API_URL = 'https://freedictionaryapi.com/api/v1/entries/en/',
    DEFAULT_HISTORY_SETTING = {
        enabled: true
    };

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { word } = request,
        url = `${DICTIONARY_API_URL}${word}`;

    fetch(url, {
            method: 'GET',
            credentials: 'omit'
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Word not found");
            }
            return response.json();
        })
        .then((data) => {
            const content = extractMeaning(data, word);

            sendResponse({ content });

            content && browser.storage.local.get().then((results) => {
                let history = results.history || DEFAULT_HISTORY_SETTING;

                history.enabled && saveWord(content);
            });
        })
        .catch((error) => {
            console.error("Error fetching definition:", error);
            sendResponse({ content: null });
        });

    return true; // Keep the message channel open for async response.
});

function extractMeaning(data, word) {

    console.log(data)
    if (!data || data.length === 0) {
        return null;
    }

    const meanings = data.entries[0].senses;
    console.log(meanings)
    const pronunciations = data.entries[0].pronunciations[0];
    console.log(pronunciations)
    let definition = "";

    // Extract the first definition from the meanings array
    if (meanings && meanings.length > 0) {
        const firstMeaning = meanings[0];
        definition = firstMeaning.definition;

    // freedictionaryapi.com stores definitions in seperate senses
        // if (definitions && definitions.length > 0) {
        //     definition = definitions[0].definition;
        // }
    }

    const phonetic = pronunciations?.text || null;
    const audioSrc = null;

    return { word, meaning: definition, phonetic, audioSrc };
}

function saveWord(content) {
    let word = content.word,
        meaning = content.meaning;

    browser.storage.local.get('definitions').then((results) => {
        let definitions = results.definitions || {};

        definitions[word] = meaning;
        browser.storage.local.set({
            definitions
        });
    });
}
