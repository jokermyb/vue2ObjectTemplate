import {
	VAxios
} from './Axios';
import { isString } from '@/utils/is';
import { joinTimestamp, formatRequestDate, deepMerge, setObjToUrlParams } from './helper';
import { ContentTypeEnum } from './baseData.js'
const urlPrefix = 'https://api.metaicon.seekitor.com';
const transform = {
	/**
	 * @description: 处理请求数据。如果数据不是预期格式，可直接抛出错误
	 */
	transformRequestHook: (res, options) => {
		const {
			isTransformResponse,
			isReturnNativeResponse
		} = options;
		// 是否返回原生响应头 比如：需要获取响应头时使用该属性
		if (isReturnNativeResponse) {
			return res;
		}
		// 不进行任何处理，直接返回
		// 用于页面代码可能需要直接获取code，data，message这些信息时开启
		if (!isTransformResponse) {
			return res.data;
		}
		// 错误的时候返回

		const {
			data
		} = res;
		if (!data) {
			// return '[HTTP] Request has no return value';
			throw new Error('请求发生错误');
		}
		//  这里 code，result，message为 后台统一的字段，需要在 types.ts内修改为项目自己的接口返回格式
		const {
			code,
			status,
			result,
			msg
		} = data;

		// 这里逻辑可以根据项目进行修改
		const hasSuccess = !code && Reflect.has(data, 'code') && code === 0;
		if (hasSuccess) {
			return result;
		}
		// 在此处根据自己项目的实际情况对不同的code执行不同的操作
		// 如果不希望中断当前请求，请return数据，否则直接抛出异常即可
		let timeoutMsg = '';
		switch (status) {
			case 401:
				timeoutMsg = '401报错';
				break;
			default:
				timeoutMsg = '根据项目需求设置报错信息';
		}

		// errorMessageMode=‘modal’的时候会显示modal错误弹窗，而不是消息提示，用于一些比较重要的错误
		// errorMessageMode='none' 一般是调用时明确表示不希望自动弹出错误提示
		if (options.errorMessageMode === 'modal') {
			alert('这边可以根据不同的type设置错误弹窗-modal')
		} else if (options.errorMessageMode === 'message') {
			alert('这边可以根据不同的type设置错误弹窗-message')
		}

		throw new Error(timeoutMsg || '当timeoutMsg没有的时候提示的错误');
	},

	// 请求之前处理config
	beforeRequestHook: (config, options) => {
		const {
			apiUrl,
			joinPrefix,
			joinParamsToUrl,
			formatDate,
			joinTime = true
		} = options;

		if (joinPrefix) {
			config.url = `${urlPrefix}${config.url}`;
		}
		const params = config.params || {};
		const data = config.data || false;
		formatDate && data && !isString(data) && formatRequestDate(data);
		if (config.method.toUpperCase() === 'GET') {
			if (!isString(params)) {
				// 给 get 请求加上时间戳参数，避免从缓存中拿数据。
				config.params = Object.assign(params || {}, joinTimestamp(joinTime, false));
			} else {
				// 兼容restful风格
				config.url = config.url + params + `${joinTimestamp(joinTime, true)}`;
				config.params = undefined;
			}
		} else {
			if (!isString(params)) {
				formatDate && formatRequestDate(params);
				if (Reflect.has(config, 'data') && config.data && Object.keys(config.data).length > 0) {
					config.data = data;
					config.params = params;
				} else {
					// 非GET请求如果没有提供data，则将params视为data
					config.data = params;
					config.params = undefined;
				}
				if (joinParamsToUrl) {
					config.url = setObjToUrlParams(
						config.url,
						Object.assign({}, config.params, config.data)
					);
				}
			} else {
				// 兼容restful风格
				config.url = config.url + params;
				config.params = undefined;
			}
		}
		return config;
	},

	/**
	 * @description: 请求拦截器处理
	 */
	requestInterceptors: (config, options) => {
		// 请求之前处理config
		// const token = getToken();
		// const token =
		//   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbl9pZCI6MiwiYWNjb3VudCI6IiIsImV4cCI6MTYyNzAzNTEyNCwiaWF0IjoxNjI3MDI3OTI0LCJzdWIiOiJ1c2VyIHRva2VuIn0.3DiT68cDP8pFLLaO3kQ0uFj3kNi5_HFT1x0mka6QeaU';
		// if (token && (config as Recordable)?.requestOptions?.withToken !== false) {
		// 	// jwt token
		// 	// config.headers.token = options.authenticationScheme
		// 	//   ? `${options.authenticationScheme} ${token}`
		// 	//   : token;
		// 	config.headers.token = token;
		// }
		// const adminToken = getAdminToken();
		// if (adminToken) {
		// 	// jwt token
		// 	config.headers.admin_token = adminToken;
		// }
		return config;
	},

	/**
	 * @description: 响应拦截器处理
	 */
	responseInterceptors: (res) => {
		return res;
	},

	/**
	 * @description: 响应错误处理
	 */
	responseInterceptorsCatch: (error) => {
		console.log('-----responseInterceptorsCatch-----', error)
		return Promise.reject(error);
	},
};

function createAxios(opt) {
	return new VAxios(
		deepMerge({
				// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#authentication_schemes
				// authentication schemes，e.g: Bearer
				// authenticationScheme: 'Bearer',
				authenticationScheme: '',
				timeout: 10 * 1000,
				// 基础接口地址
				// baseURL: globSetting.apiUrl,
				// 接口可能会有通用的地址部分，可以统一抽取出来
				// urlPrefix: urlPrefix,
				headers: {
					'Content-Type': ContentTypeEnum.JSON
				},
				// 如果是form-data格式
				// headers: { 'Content-Type': ContentTypeEnum.FORM_URLENCODED },
				// 数据处理方式
				transform,
				// 配置项，下面的选项都可以在独立的接口请求中覆盖
				requestOptions: {
					// 默认将prefix 添加到url
					joinPrefix: true,
					// 是否返回原生响应头 比如：需要获取响应头时使用该属性
					isReturnNativeResponse: false,
					// 需要对返回数据进行处理
					isTransformResponse: true,
					// post请求的时候添加参数到url
					joinParamsToUrl: false,
					// 格式化提交参数时间
					formatDate: true,
					// 消息提示类型
					errorMessageMode: 'message',
					// 接口地址
					apiUrl: urlPrefix,
					//  是否加入时间戳
					joinTime: true,
					// 忽略重复请求
					ignoreCancelToken: true,
					// 是否携带token
					withToken: true,
				},
			},
			opt || {}
		)
	);
}
export const defHttp = createAxios();
