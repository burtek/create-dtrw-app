import { dirname, resolve } from 'node:path';
import './toMatchFileObject.js'
import { fileURLToPath } from 'node:url';


describe.each([
    { filename: 'some.json' },
    { filename: 'some.yaml' }
])('vitest .toMatchFileObject matcher for $filename', ({ filename }) => {
    const path = resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures/', filename);
    
    it('should allow shallow partial', () => {
        expect(path).toMatchFileObject({
            "enabled": true,
            "port": 8080,
            "owner": {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "active": true
            }
        })
    });
    
    it('should not allow deep partial', () => {
        expect(path).not.toMatchFileObject({
            "enabled": true,
            "port": 8080,
            "owner": {
                "name": "Jane Doe",
                "email": "jane@example.com"
            }
        });
    });
})
