/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  // tutorialSidebar: [{ type: 'autogenerated', dirName: '.' }],

  // But you can create a sidebar manually

  // tutorialSidebar: [{
  //     type: 'category',
  //     label: 'React',
  //     items: ['react'],
  // }, ],
  leetcode: [
      {
          type: 'category',
          label: '随想录',
          items: [
              {
                  type: 'autogenerated',
                  dirName: 'leetcode/随想录'
              },
          ],
      },
      {
          type: 'category',
          label: '算法合集',
          items: [
              {
                  type: 'autogenerated',
                  dirName: 'leetcode/算法合集'
              },
          ],
      },
  ],

    Cpp: [
        {
            type: 'category',
            label: '语言基础',
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'Cpp/语言基础'
                },
            ],
        },
        {
            type: 'category',
            label: 'Cpp编译',
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'Cpp/Cpp编译'
                },
            ],
        },
{
            type: 'category',
            label: '项目',
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'Cpp/项目'
                },
            ],
        },
    ],

    tools: [
        {
            type: 'category',
            label: 'tools',
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'tools'
                },
            ],
        },
    ],


};

module.exports = sidebars;