import React from 'react';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>About Heritage Atlas</h1>
        <p className="subtitle">Preserving India's Traditional Art Forms Through Technology</p>
      </div>

      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          Heritage Atlas is a digital marketplace dedicated to preserving and promoting 
          India's Geographical Indication (GI)-tagged traditional art forms. We believe that 
          every artisan deserves visibility and every traditional craft deserves recognition.
        </p>
      </section>

      <section className="about-section">
        <h2>What We Do</h2>
        <div className="features-list">
          <div className="feature-item">
            <div className="feature-icon">🗺️</div>
            <h3>Geographical Organization</h3>
            <p>
              Products are organized by cultural regions rather than generic categories, 
              making it easier to discover crafts based on their geographical and cultural origins.
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🏷️</div>
            <h3>GI-Tagged Products</h3>
            <p>
              All products are associated with their Geographical Indication tags, ensuring 
              authenticity and preserving the cultural identity of traditional crafts.
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📖</div>
            <h3>Cultural Storytelling</h3>
            <p>
              Each product includes cultural stories, history, and traditions, helping 
              users understand the rich heritage behind every craft.
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">👨‍🎨</div>
            <h3>Artisan-First Approach</h3>
            <p>
              We prioritize the needs of artisans, especially those in rural areas, 
              providing them with easy product uploads and fair visibility.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Technology</h2>
        <p>
          Heritage Atlas leverages modern web technologies to provide a fast, 
          intuitive, and scalable platform:
        </p>
        <ul className="tech-list">
          <li><strong>Frontend:</strong> Modern web technologies with TypeScript for a responsive user interface</li>
          <li><strong>Backend:</strong> FastAPI for high-performance API endpoints</li>
          <li><strong>Database:</strong> MongoDB with aggregation pipelines for efficient region-based filtering</li>
          <li><strong>Maps:</strong> Interactive geographical exploration</li>
          <li><strong>Deployment:</strong> Cloud hosting for scalable performance</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Join Us</h2>
        <p>
          Whether you're an artisan looking to showcase your work, a buyer interested 
          in traditional crafts, or someone passionate about preserving cultural heritage, 
          Heritage Atlas welcomes you.
        </p>
        <div className="cta-buttons">
          <a href="/upload" className="btn btn-primary">Upload Your Product</a>
          <a href="/products" className="btn btn-secondary">Explore Products</a>
        </div>
      </section>
    </div>
  );
};

export default About;
