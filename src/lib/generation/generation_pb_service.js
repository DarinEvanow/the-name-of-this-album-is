// package: gooseai
// file: generation.proto

import generation_pb from './generation_pb';
import pkg from '@improbable-eng/grpc-web';
const { grpc } = pkg;

var GenerationService = (function () {
	function GenerationService() {}
	GenerationService.serviceName = 'gooseai.GenerationService';
	return GenerationService;
})();

GenerationService.Generate = {
	methodName: 'Generate',
	service: GenerationService,
	requestStream: false,
	responseStream: true,
	requestType: generation_pb.Request,
	responseType: generation_pb.Answer
};

GenerationService.ChainGenerate = {
	methodName: 'ChainGenerate',
	service: GenerationService,
	requestStream: false,
	responseStream: true,
	requestType: generation_pb.ChainRequest,
	responseType: generation_pb.Answer
};

function GenerationServiceClient(serviceHost, options) {
	this.serviceHost = serviceHost;
	this.options = options || {};
}

GenerationServiceClient.prototype.generate = function generate(requestMessage, metadata) {
	var listeners = {
		data: [],
		end: [],
		status: []
	};
	var client = grpc.invoke(GenerationService.Generate, {
		request: requestMessage,
		host: this.serviceHost,
		metadata: metadata,
		transport: this.options.transport,
		debug: this.options.debug,
		onMessage: function (responseMessage) {
			listeners.data.forEach(function (handler) {
				handler(responseMessage);
			});
		},
		onEnd: function (status, statusMessage, trailers) {
			listeners.status.forEach(function (handler) {
				handler({ code: status, details: statusMessage, metadata: trailers });
			});
			listeners.end.forEach(function (handler) {
				handler({ code: status, details: statusMessage, metadata: trailers });
			});
			listeners = null;
		}
	});
	return {
		on: function (type, handler) {
			listeners[type].push(handler);
			return this;
		},
		cancel: function () {
			listeners = null;
			client.close();
		}
	};
};

GenerationServiceClient.prototype.chainGenerate = function chainGenerate(requestMessage, metadata) {
	var listeners = {
		data: [],
		end: [],
		status: []
	};
	var client = grpc.invoke(GenerationService.ChainGenerate, {
		request: requestMessage,
		host: this.serviceHost,
		metadata: metadata,
		transport: this.options.transport,
		debug: this.options.debug,
		onMessage: function (responseMessage) {
			listeners.data.forEach(function (handler) {
				handler(responseMessage);
			});
		},
		onEnd: function (status, statusMessage, trailers) {
			listeners.status.forEach(function (handler) {
				handler({ code: status, details: statusMessage, metadata: trailers });
			});
			listeners.end.forEach(function (handler) {
				handler({ code: status, details: statusMessage, metadata: trailers });
			});
			listeners = null;
		}
	});
	return {
		on: function (type, handler) {
			listeners[type].push(handler);
			return this;
		},
		cancel: function () {
			listeners = null;
			client.close();
		}
	};
};

export { GenerationServiceClient };
