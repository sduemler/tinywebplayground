import type { PhilosopherCard } from "./types";
import SchoolGlyph from "./SchoolGlyph";
import WaxSeal from "./WaxSeal";

interface Props {
  data: PhilosopherCard;
  onClick?: () => void;
}

export default function Card({ data, onClick }: Props) {
  return (
    <div className="card" data-school={data.school} data-rarity={data.rarity} onClick={onClick}>
      <div className="card-inner">
        <div className="card-head">
          <div className="card-name">
            {data.name}
            {data.epithet ? <span className="epithet">{data.epithet}</span> : null}
          </div>
          <div className="card-influence">
            <span className="num">{data.influence}</span>
            <span className="lbl">Influence</span>
          </div>
        </div>
        <div className="card-portrait">
          {data.portraitSrc ? (
            <img src={data.portraitSrc} alt={data.name} style={{ objectPosition: data.portraitPos }} />
          ) : null}
          <div className="vignette"></div>
        </div>
        <div className="card-body">
          <div className="card-meta">
            <div className="meta-school">
              <SchoolGlyph school={data.school} size={15} />
              <span className="school">{data.schoolLabel}</span>
            </div>
            <div className="meta-era">{data.era}</div>
          </div>
          <div className="ability">
            <div className="ability-head">
              <span className="ability-name">{data.move.name}</span>
              <span className="ability-cost">
                {data.move.passive ? (
                  <span className="pip passive" title="passive"></span>
                ) : (
                  Array.from({ length: data.move.cost }).map((_, j) => <span key={j} className="pip"></span>)
                )}
              </span>
            </div>
            <div className="ability-text">
              {data.move.text}{" "}
              {data.move.dmg && <span className="ability-dmg">{data.move.dmg}</span>}
              {data.move.tail && <> {data.move.tail}</>}
            </div>
          </div>
          <div className="card-quote">
            <p className="quote-text">“{data.quote}”</p>
            <div className="quote-attr">— {data.name}</div>
          </div>
          <div className="card-id">
            <span>{data.id}</span>
            <span style={{ textTransform: "capitalize" }}>{data.rarity}</span>
          </div>
        </div>
        <div className="card-seal-slot">
          <WaxSeal rarity={data.rarity} size={44} />
        </div>
      </div>
    </div>
  );
}
