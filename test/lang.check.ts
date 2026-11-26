// Run: node test/lang.check.ts
import assert from 'node:assert/strict'
import { detectLanguage, parseLanguage } from '../hooks/lang.ts'

assert.equal(parseLanguage('German')?.code, 'de')
assert.equal(parseLanguage(' deutsch ')?.code, 'de')
assert.equal(parseLanguage('Deutsch (detected)')?.code, 'de')
assert.equal(parseLanguage('I speak Polish')?.code, 'pl')
assert.equal(parseLanguage('Italiano')?.code, 'it')
assert.equal(parseLanguage('Español')?.code, 'es')
assert.equal(parseLanguage('klingon'), null)

assert.equal(detectLanguage(['Ja hat funktioniert! Nur wäre besser wenn es einen eigenen Befehl gibt und das ist noch nicht so']) ?.code, 'de')
assert.equal(detectLanguage(['Yes it works, but can you make this a separate command and the setup with language?'])?.code, 'en')
assert.equal(detectLanguage(['Tak, działa, ale czy możesz to zrobić? To nie jest proste, dziękuję'])?.code, 'pl')
assert.equal(detectLanguage(['Sì funziona, ma non è facile, grazie per questo e anche per il resto'])?.code, 'it')
assert.equal(detectLanguage(['ok']), null)
console.log('Language checks passed.')
