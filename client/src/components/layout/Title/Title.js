import React from 'react';

const Title = ({ title, subtitle, highlight }) => {
  return (
    <div className="title">
      <h3>
        {title} <span className="highlight">{highlight}</span>!
      </h3>
      <p>{subtitle}</p>
    </div>
  );
};

export default Title;
