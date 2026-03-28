import "./Panel.css";

export default function Panel({
  title,
  icon,
  controls,
  footer,
  className = "",
  children,
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-header">
        <div className="panel-title">
          {icon && <span className="panel-icon">{icon}</span>}
          <h2>{title}</h2>
        </div>
        {controls && <div className="panel-controls">{controls}</div>}
      </div>
      <div className="panel-body">{children}</div>
      {footer && <div className="panel-footer">{footer}</div>}
    </section>
  );
}
