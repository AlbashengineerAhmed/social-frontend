import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  const hasCustomOverflow = className.includes('overflow-');
  return (
    <div className={`bg-white border border-gray-100 rounded-xl shadow-xs ${hasCustomOverflow ? '' : 'overflow-hidden'} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-4 sm:p-5 border-b border-gray-100 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-4 sm:p-5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-4 sm:p-5 border-t border-gray-100 bg-gray-50/50 ${className}`} {...props}>
      {children}
    </div>
  );
};

