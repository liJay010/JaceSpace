import useBaseUrl from '@docusaurus/useBaseUrl';
import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

type FeatureItem = {
  title: string;
  image: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'This is my notebook',
    image: '/img/undraw_docusaurus_mountain.svg',
    description: (
      <>
          Welcome to my blog homepage
      </>
    ),
  },
  {
    title: 'Me as a Programmer',
    image: '/img/undraw_docusaurus_tree.svg',
    description: (
      <>
        Using Python and Cpp
      </>
    ),
  },
  {
    title: 'About Me',
    image: '/img/undraw_docusaurus_react.svg',
    description: (
      <>
        A graduate student at UESTC
      </>
    ),
  },
];

function Feature({title, image, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img
          className={styles.featureSvg}
          alt={title}
          src={useBaseUrl(image)}
        />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
