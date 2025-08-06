// babel.config.js - Babel configuration for both server and client-side code

module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current',
                },
                modules: 'commonjs',
            },
        ],
        [
            '@babel/preset-react',
            {
                runtime: 'automatic', // Important for React 19
                development: process.env.NODE_ENV === 'development',
            },
        ],
    ],
    env: {
        test: {
            presets: [
                [
                    '@babel/preset-env',
                    {
                        targets: {
                            node: 'current',
                        },
                    },
                ],
                [
                    '@babel/preset-react',
                    {
                        runtime: 'automatic',
                    },
                ],
            ],
        },
    },
};