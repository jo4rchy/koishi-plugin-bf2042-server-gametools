import { Context, Schema } from 'koishi';
export declare const name = "bf2042-server";
export declare const usage = "\u67E5\u8BE2 BF2042 \u670D\u52A1\u5668\u72B6\u6001\u7684\u63D2\u4EF6";
export declare function fetchServerDetail(options: {
    serverName?: string;
    serverID?: string;
}): Promise<string>;
export declare function fetchServers(name?: string, region?: string, limit?: number): Promise<string>;
export interface Config {
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context): void;
