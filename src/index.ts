import './styles.scss';

import { registerToolType, Bar, Tool, Icon } from './core';
import { registerAll as registerAllConponents } from './components';
import { themes } from './theme';
import { assertProps } from './utils';

// TODO: add jest tests  https://github.com/testing-library/jest-dom

// TODO: bundle umd + esm

// TODO: integrate icon packs

registerAllConponents();


export {
    Bar,
    registerToolType,
    assertProps,
    Tool,
    Icon,
    themes
}