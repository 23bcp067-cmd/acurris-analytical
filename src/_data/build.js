export default {
	year: new Date().getUTCFullYear(),
	date: new Date().toISOString().slice(0, 10),
	leadApiUrl: "/api/lead",
};
