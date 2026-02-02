// src/components/NewsArticle.jsx
import React, { useState } from 'react';
import { NewsService } from '../services/newsService';
import { format } from 'date-fns';

const NewsArticle = ({ article, showAnalysis = false }) => {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const articleText = `${article.title}. ${article.description || ''} ${article.content || ''}`;
      const result = await NewsService.analyzeArticle(articleText);
      setAnalysis(result.analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };
  
  return (
    <article className="news-article">
      {article.imageUrl && (
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="article-image"
          onError={(e) => e.target.style.display = 'none'}
        />
      )}
      
      <div className="article-content">
        <div className="article-meta">
          <span className="article-source">{article.source}</span>
          <span className="article-sport">{article.sport?.toUpperCase()}</span>
          <span className="article-date">
            {format(new Date(article.publishedAt), 'MMM d, h:mm a')}
          </span>
        </div>
        
        <h3 className="article-title">
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            {article.title}
          </a>
        </h3>
        
        <p className="article-excerpt">{article.description || article.excerpt}</p>
        
        {article.author && (
          <div className="article-author">By {article.author}</div>
        )}
        
        {showAnalysis && (
          <div className="article-analysis">
            <button 
              onClick={handleAnalyze} 
              disabled={analyzing}
              className="analyze-btn"
            >
              {analyzing ? 'Analyzing...' : '🤖 AI Analysis'}
            </button>
            
            {analysis && (
              <div className="analysis-content">
                <h4>AI Analysis:</h4>
                <p>{analysis}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default NewsArticle;
