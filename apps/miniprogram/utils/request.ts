/**
 * 统一请求封装：接口地址、超时、错误分类、可选重试。
 * 错误统一抛出 ApiError，页面据 kind 显示「重试」「暂无权限」等状态（PRD 第 14 章）。
 */
import { config } from '../config';

export type ApiErrorKind = 'not_configured' | 'network' | 'timeout' | 'http' | 'business';

export class ApiError extends Error {
  constructor(
    public kind: ApiErrorKind,
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 网络类错误可以让用户重试 */
  get retryable(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || (this.kind === 'http' && (this.status ?? 0) >= 500);
  }
}

export interface RequestOptions {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: WechatMiniprogram.IAnyObject;
  header?: Record<string, string>;
  timeout?: number;
  /** 网络类错误自动重试次数，默认 0 */
  retry?: number;
}

/** 约定的后端响应格式：{ ok, data } 或 { ok: false, code, message } */
interface Envelope<T> {
  ok: boolean;
  data?: T;
  code?: string;
  message?: string;
}

function once<T>(opts: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    wx.request<Envelope<T>>({
      url: config.API_BASE_URL + opts.path,
      method: opts.method ?? 'GET',
      data: opts.data,
      header: { 'Content-Type': 'application/json', ...opts.header },
      timeout: opts.timeout ?? config.REQUEST_TIMEOUT,
      success(res) {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new ApiError('http', `HTTP ${res.statusCode}`, res.statusCode));
          return;
        }
        const body = res.data;
        if (!body || !body.ok) {
          reject(new ApiError('business', body?.message ?? '服务返回异常', res.statusCode, body?.code));
          return;
        }
        resolve(body.data as T);
      },
      fail(err) {
        const timeout = /timeout/i.test(err.errMsg);
        reject(new ApiError(timeout ? 'timeout' : 'network', timeout ? '请求超时' : '网络连接失败'));
      },
    });
  });
}

export async function request<T>(opts: RequestOptions): Promise<T> {
  if (!config.API_BASE_URL) {
    throw new ApiError('not_configured', '接口地址尚未配置');
  }
  let attempt = 0;
  for (;;) {
    try {
      return await once<T>(opts);
    } catch (e) {
      if (e instanceof ApiError && e.retryable && attempt < (opts.retry ?? 0)) {
        attempt += 1;
        continue;
      }
      throw e;
    }
  }
}
