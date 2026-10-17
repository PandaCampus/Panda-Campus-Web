/** 运行配置。后端接入后把 API_BASE_URL 填上，并把 USE_SAMPLE_DATA 改为 false。 */
export const config = {
  /** 接口根地址，需要先在小程序后台配置为合法 request 域名 */
  API_BASE_URL: '',
  /** 接口未就绪时使用 UI 母版的示例卡（会标记 sample: true），上线前必须关闭 */
  USE_SAMPLE_DATA: true,
  /** 单次请求超时（毫秒） */
  REQUEST_TIMEOUT: 10000,
};
