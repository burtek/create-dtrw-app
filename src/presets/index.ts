import { ObjectIterator } from "../utils/object-iterators.js";
import { Preset } from "./internal/preset.js";
import { NodeJSSQLitePreset } from "./presets/nodejs-sqlite.js";
import { NodeJSPreset } from "./presets/nodejs.js";
import { ReactPreset } from "./presets/react.js";
import { WorkspaceRootPreset } from "./presets/workspace-root.js";

/*********************** PRESETS **********************/

const allPresets = [
    new WorkspaceRootPreset(),
    new NodeJSPreset(),
    new NodeJSSQLitePreset(),
    new ReactPreset(),
    // angular
    // python
];
const presetByType = Object.fromEntries(allPresets.map(p => [p.TYPE, p] as const)) as unknown as Record<Type, Preset>;

type Type = (typeof allPresets)[number]['TYPE'];

export const PRESETS = new ObjectIterator(presetByType)
    .filter((preset) => preset.show)
    .map(preset => preset.description)
    .value();

export const getPreset = (type: Type) => presetByType[type];

/*********************** STARTERS **********************/

export const STARTERS = {
    'ui-only': {
        frontend: 'reactjs'
    },
    'fullstack': {
        frontend: 'reactjs',
        backend: 'nodejs'
    },
    'fullstack-sqlite': {
        frontend: 'reactjs',
        backend: 'nodejs-sqlite'
    }
} satisfies Record<string, Record<string, Type>>
