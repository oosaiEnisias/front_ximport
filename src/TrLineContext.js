import { createContext } from "react";
import { useImmer } from 'use-immer';

export const TrLineContext = createContext(useImmer([]));