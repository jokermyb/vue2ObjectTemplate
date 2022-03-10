import axios from 'axios'
import {
	omit,
	cloneDeep
} from 'lodash-es';
import qs from 'qs';
import {
	isFunction
} from '@/utils/is';
import { ContentTypeEnum, RequestEnum } from './baseData.js'

export class VAxios {
	axiosInstance;
	options;
	constructor(options) {
		this.options = options;
		this.axiosInstance = axios.create(options);
		this.setupInterceptors();
	}
	/**
	 * @description:  Create axios instance
	 */
	createAxios(config) {
		this.axiosInstance = axios.create(config);
	}
	getTransform() {
		const {
			transform
		} = this.options;
		return transform;
	}
	getAxios() {
		return this.axiosInstance;
	}
	/**
	 * @description: Reconfigure axios
	 */
	configAxios(config) {
		if (!this.axiosInstance) {
			return;
		}
		this.createAxios(config);
	}
	/**
	 * @description: Set general header
	 */
	setHeader(headers) {
		if (!this.axiosInstance) {
			return;
		}
		Object.assign(this.axiosInstance.defaults.headers, headers);
	}
	setupInterceptors() {
		const transform = this.getTransform();
		if (!transform) {
			return;
		}
		const {
			requestInterceptors,
			requestInterceptorsCatch,
			responseInterceptors,
			responseInterceptorsCatch,
		} = transform;
		this.axiosInstance.interceptors.request.use((config) => {
			if (requestInterceptors && isFunction(requestInterceptors)) {
				config = requestInterceptors(config, this.options);
			}
			return config;
		}, undefined);
		// Request interceptor error capture
		requestInterceptorsCatch &&
			isFunction(requestInterceptorsCatch) &&
			this.axiosInstance.interceptors.request.use(undefined, requestInterceptorsCatch);

		// Response result interceptor error capture
		responseInterceptorsCatch &&
			isFunction(responseInterceptorsCatch) &&
			this.axiosInstance.interceptors.response.use(undefined, responseInterceptorsCatch);
	}

	/**
	 * @description:  File Upload
	 */
	uploadFile(config, params) {
		const formData = new window.FormData();
		if (params.data) {
			Object.keys(params.data).forEach((key) => {
				if (!params.data) return;
				const value = params.data[key];
				if (Array.isArray(value)) {
					value.forEach((item) => {
						formData.append(`${key}[]`, item);
					});
					return;
				}

				formData.append(key, params.data[key]);
			});
		}
		formData.append(params.name || 'file', params.file, params.filename);
		const customParams = omit(params, 'file', 'filename', 'file');

		Object.keys(customParams).forEach((key) => {
			formData.append(key, customParams[key]);
		});

		return this.axiosInstance.request({
			...config,
			method: 'POST',
			data: formData,
			headers: {
				'Content-type': ContentTypeEnum.FORM_DATA,
				ignoreCancelToken: true,
			},
		});
	}

	// support form-data
	supportFormData(config) {
		const headers = config.headers || this.options.headers;
		const contentType = headers['Content-Type'] || headers['content-type'];
		if (
			contentType !== ContentTypeEnum.FORM_URLENCODED ||
			!Reflect.has(config, 'data') ||
			config.method?.toUpperCase() === RequestEnum.GET
		) {
			return config;
		}

		return {
			...config,
			data: qs.stringify(config.data, {
				arrayFormat: 'brackets'
			}),
		};
	}

	get(config, options) {
		return this.request({
			...config,
			method: 'GET'
		}, options);
	}

	post(config, options) {
		return this.request({
			...config,
			method: 'POST'
		}, options);
	}

	put(config, options) {
		return this.request({
			...config,
			method: 'PUT'
		}, options);
	}

	delete(config, options) {
		return this.request({
			...config,
			method: 'DELETE'
		}, options);
	}

	request(config, options) {
		let conf = cloneDeep(config);
		const transform = this.getTransform();

		const {
			requestOptions
		} = this.options;

		const opt = Object.assign({}, requestOptions, options);
		const {
			beforeRequestHook,
			requestCatchHook,
			transformRequestHook
		} = transform || {};
		if (beforeRequestHook && isFunction(beforeRequestHook)) {
			conf = beforeRequestHook(conf, opt);
		}
		conf.requestOptions = opt;

		conf = this.supportFormData(conf);

		return new Promise((resolve, reject) => {
			this.axiosInstance
				.request(conf)
				.then((res) => {
					if (transformRequestHook && isFunction(transformRequestHook)) {
						try {
							const ret = transformRequestHook(res, opt);
							resolve(ret);
						} catch (err) {
							reject(err || new Error('request error!'));
						}
			  	return;
					}
					resolve(res);
				})
				.catch((e) => {
					if (requestCatchHook && isFunction(requestCatchHook)) {
						reject(requestCatchHook(e, opt));
						return;
					}
					if (axios.isAxiosError(e)) {
						// rewrite error message from axios in here
					}
					reject(e);
				});
		});
	}
}
