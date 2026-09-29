import { CookieHelpers } from "../../../dev-utils/helpers/CookieHelpers";
import { Store } from "../Store";

export type Session =
	| {
			id: string;
			expires: number;
			activeCart: {
				cartRef: {
					id: string;
				};
			};
	  }
	| undefined;

type Action = { type: "SET_SESSION"; session: Session } | { type: "CLEAR_SESSION" };

const cocoSessionStore = new Store<Session, Action>((action, _state, setState) => {
	switch (action.type) {
		case "SET_SESSION":
			CookieHelpers.setSession(action.session);
			setState(action.session);
			break;
		case "CLEAR_SESSION":
			CookieHelpers.clearSession();
			setState(undefined);
			break;
		default:
			break;
	}
}, undefined);

export default cocoSessionStore;
