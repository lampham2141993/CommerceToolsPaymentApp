import type { ReducerFunction } from "./ReducerFunction";

export class Store<State, Action> {
	private listeners = new Map();
	private state: State;
	private reducer: ReducerFunction<Action, State>;

	constructor(reducer: ReducerFunction<Action, State>, initialState: State) {
		this.state = initialState;
		this.reducer = reducer;
		this.subscribe = this.subscribe.bind(this);
		this.getSnapshot = this.getSnapshot.bind(this);
		this.dispatch = this.dispatch.bind(this);
	}

	private setState(state: State) {
		if (state !== this.state) {
			this.state = state;
			this.listeners.forEach((listener) => listener());
		}
	}

	public subscribe(fn: () => void) {
		this.listeners.set(fn, fn);
		return () => this.listeners.delete(fn);
	}

	public getSnapshot() {
		return this.state;
	}

	public dispatch(action: Action) {
		this.reducer(action, this.state, this.setState.bind(this));
	}
}
