import { LRUCache } from "lru-cache";
import { NextResponse } from "next/server";

interface RateLimitOptions {
    uniqueTokenPerInterval: number; // 同時に追跡する最大ユーザー数（メモリ保護のため）
    intervalMs: number;              // 制限をリセットする間隔（ミリ秒）
}

export function createRateLimit(options: RateLimitOptions) {
    const tokenCache = new LRUCache<string, number>({
        max: options.uniqueTokenPerInterval,
        ttl: options.intervalMs,
    });

    return {
        /**
         * @param limit そのインターバル内で許可する最大リクエスト数
         * @param token ユーザーの一意な識別子（例: user.id または IP）
         */
        check: (limit: number, token: string) => {
            const currentUsage = tokenCache.get(token) || 0;

            if (currentUsage >= limit) {
                return { isRateLimited: true, currentUsage };
            }

            tokenCache.set(token, currentUsage + 1);
            return { isRateLimited: false, currentUsage: currentUsage + 1 };
        },
    };
}

// 共通で使用するレートリミッターインスタンスを作成（例: 1分間に最大20回）
// メモリベースなのでプロセスやVercel Edge/Serverlessのインスタンスごとにリセットされます。
// 厳密な分散レート制限が必要な場合は Upstash Redis などの導入を推奨します。
export const apiRateLimiter = createRateLimit({
    uniqueTokenPerInterval: 500,
    intervalMs: 60 * 1000, // 1分
});

// 各APIで使い回せるヘルパー関数
export function checkRateLimit(userId: string, limit: number = 10) {
    const { isRateLimited } = apiRateLimiter.check(limit, userId);

    if (isRateLimited) {
        return NextResponse.json(
            { error: "リクエストの上限に達しました。しばらく時間をおいてから再度お試しください。" },
            { status: 429 } // Too Many Requests
        );
    }
    return null; // 問題なし
}
