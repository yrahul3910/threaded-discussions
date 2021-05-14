const config = {
    verbose: true,
    setupFilesAfterEnv: ['./src/componentTestUtils.js']
};

module.exports = config;

// Or async function
module.exports = async() => ({ verbose: true, });
