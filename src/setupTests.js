import "@testing-library/jest-dom";
import * as axeMatchers from "vitest-axe/matchers";
import { expect } from "vitest";
import dayjs from 'dayjs';
import "dayjs/locale/es";

expect.extend(axeMatchers);
dayjs.locale('es');
HTMLCanvasElement.prototype.getContext = () => null;