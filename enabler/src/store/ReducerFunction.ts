export type ReducerFunction<Action, State> = (action: Action, state: State, setState: (state: State) => void) => void;
