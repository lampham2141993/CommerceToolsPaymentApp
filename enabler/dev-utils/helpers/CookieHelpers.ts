import { COCO_SESSION_COOKIE_KEY, cookieHandler } from "../cookieHandling";
import type { Session } from "../../src/store/stores/CoCoSessionStore";

export class CookieHelpers {
	static getSession(): Session | undefined {
		const sessionString = cookieHandler.getCookie(COCO_SESSION_COOKIE_KEY);
		if (!sessionString || sessionString === true) {
			return undefined;
		}
		return JSON.parse(sessionString);
	}

	static setSession(session: Session): void {
		cookieHandler.setCookie(COCO_SESSION_COOKIE_KEY, JSON.stringify(session));
	}

	static clearSession(): void {
		cookieHandler.deleteCookie(COCO_SESSION_COOKIE_KEY);
	}
}
