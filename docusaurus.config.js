// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const math = require('remark-math');
const katex = require('rehype-katex');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Notebook',
  tagline: 'Jace日常随笔',
  url: 'https://space.jace.asia',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'facebook', // Usually your GitHub org/user name.
  projectName: 'JaceSpace', // Usually your repo name.

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          remarkPlugins: [math],
          rehypePlugins: [katex],
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  plugins: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        // ... Your options.
        // `hashed` is recommended as long-term-cache of index file is possible.
        hashed: true,
        // For Docs using Chinese, The `language` is recommended to set to:
        // ```
        language: ["en", "zh"],
        // ```
        // When applying `zh` in language, please install `nodejieba` in your project.
        translations: {
          search_placeholder: "Search",
          see_all_results: "See all results",
          no_results: "No results.",
          search_results_for: 'Search results for "{{ keyword }}"',
          search_the_documentation: "Search the documentation",
          count_documents_found: "{{ count }} document found",
          count_documents_found_plural: "{{ count }} documents found",
          no_documents_were_found: "No documents were found",
        },
      },
    ],
  ],

  themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            metadata: [
                /**{ name: 'keywords', content: 'notebook,Sonder,Algorithm,题解,算法,编程,学习笔记,深度学习,模型鲁棒性' },
                { name: 'google-site-verification', content: 'rI6AJ6opyy43RCnFkrJtE5U-kufn37HuWdEVXmS43E' },
                { name: 'baidu-site-verification', content: 'code-BWReuturyA' }**/
            ],
            navbar: {
                title: 'Jace日常',
                logo: {
                    alt: 'My Site Logo',
                    src: 'img/logo.svg',
                },
                items: [
                    {
                        to: "/docs/Cpp/语言基础/基础入门语法",
                        activeBasePath: '/docs/Cpp/语言基础',
                        label: "Cpp",
                        position: "left",
                    },
                    {
                        to: "/docs/tools/linux/Linux",
                        activeBasePath: '/docs/tools/linux',
                        label: "tools",
                        position: "left",
                    },
                    {
                        to: "/docs/leetcode/随想录/数组链表",
                        activeBasePath: '/docs/leetcode/随想录',
                        label: "leetcode",
                        position: "left",
                    },


                    {
                        href: 'https://github.com/liJay010',
                        label: 'GitHub',
                        position: 'right',
                    },
                ],
            },
            footer: {
                style: 'light',
                copyright: `© ${new Date().getFullYear()} Jace`,
            }, 
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme,
            },
        }),
    stylesheets: [
      {
        href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
        type: 'text/css',
        integrity:
          'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
        crossorigin: 'anonymous',
      },
    ],
};

module.exports = config;
