import { serialize, type SerializeOptions } from "cookie";
import { type CookieValueTypes } from "./CookieValueTypes";
import { type TmpCookiesObj } from "./TmpCookiesObj";

class CookieHandler {
	stringify(value: string = ""): string {
		try {
			const result = JSON.stringify(value);
			return /^[\{\[]/.test(result) ? result : value;
		} catch (e) {
			return value;
		}
	}

	decode(str: string): string {
		return str ? str.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent) : str;
	}

	processValue(value: string): CookieValueTypes {
		switch (value) {
			case "true":
				return true;
			case "false":
				return false;
			case "undefined":
				return undefined;
			case "null":
				return null;
			default:
				return value;
		}
	}

	getCookies(): TmpCookiesObj {
		const _cookies: TmpCookiesObj = {};
		const documentCookies = document.cookie ? document.cookie.split("; ") : [];

		for (let i = 0, len = documentCookies.length; i < len; i++) {
			const cookieParts = documentCookies[i]!.split("=");

			const _cookie = cookieParts.slice(1).join("=");
			const name: string = cookieParts[0]!;

			_cookies[name] = _cookie;
		}

		return _cookies;
	}

	hasCookie(key: string): boolean {
		return this.getCookies().hasOwnProperty(key);
	}

	setCookie(key: string, data: any): void {
		let _cookieOptions: SerializeOptions = {
			secure: true,
		};

		const cookieStr = serialize(key, this.stringify(data), {
			path: "/",
			..._cookieOptions,
		});
		document.cookie = cookieStr;
	}

	getCookie(key: string): CookieValueTypes {
		const _cookies = this.getCookies();
		const value = _cookies[key];

		if (value === undefined) {
			return undefined;
		}
		return this.processValue(this.decode(value));
	}

	deleteCookie(key: string): void {
		this.setCookie(key, "");
	}
}

const cookieHandler = new CookieHandler();

export { cookieHandler };
