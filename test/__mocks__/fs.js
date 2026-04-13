

// const actualFs = require('fs');
const actualFs = jest.requireActual('fs');
const ufs = require('unionfs').ufs;
const memfs = require('memfs').fs;

const fse = require('memfs-extra').extendWithFsExtraApiFromUnionfs(ufs
	.use(memfs)
	.use(actualFs))
;

module.exports = {
	...fse,
}
