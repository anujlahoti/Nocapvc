import { useState, useEffect } from "react";

const PARAMETERS = [
  {
    id: "problem",
    label: "Problem Clarity",
    description: "How clearly is the ₹4.25L Cr gap articulated?",
  },
  {
    id: "market",
    label: "Market Potential",
    description: "How big and credible is the opportunity?",
  },
  {
    id: "founder",
    label: "Founder Credibility",
    description: "How much do you trust the person behind this?",
  },
  {
    id: "execution",
    label: "Execution Readiness",
    description: "How actionable and real does the plan feel?",
  },
  {
    id: "investability",
    label: "Overall Investability",
    description: "Would you back or partner with BYAJ?",
  },
];

const STORAGE_KEY = "byaj_reviews_v1";

function loadReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReviews(reviews) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {}
}

function computeAggregates(reviews) {
  if (reviews.length === 0) return null;
  const sums = {};
  PARAMETERS.forEach((p) => (sums[p.id] = 0));
  reviews.forEach((r) => {
    PARAMETERS.forEach((p) => {
      sums[p.id] += r.ratings[p.id] || 0;
    });
  });
  const avgs = {};
  PARAMETERS.forEach((p) => {
    avgs[p.id] = sums[p.id] / reviews.length;
  });
  return avgs;
}

function StarRow({ paramId, label, description, value, onChange, readonly }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "14px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#1a1a1a",
              marginBottom: "2px",
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: "12px", color: "#888" }}>{description}</div>
        </div>
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = readonly
              ? star <= Math.round(value)
              : star <= (hovered || value);
            const partial =
              readonly && !Number.isInteger(value) && star === Math.ceil(value);
            return (
              <button
                key={star}
                disabled={readonly}
                onClick={() => !readonly && onChange(paramId, star)}
                onMouseEnter={() => !readonly && setHovered(star)}
                onMouseLeave={() => !readonly && setHovered(0)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: readonly ? "default" : "pointer",
                  padding: "2px",
                  fontSize: "24px",
                  lineHeight: 1,
                  color: filled ? "#f5a623" : partial ? "#f5a623" : "#ddd",
                  transition: "color 0.15s, transform 0.1s",
                  transform:
                    !readonly && star <= (hovered || value)
                      ? "scale(1.15)"
                      : "scale(1)",
                  filter: partial ? "drop-shadow(0 0 2px #f5a62388)" : "none",
                }}
                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""} for ${label}`}
              >
                {filled || partial ? "★" : "☆"}
              </button>
            );
          })}
        </div>
      </div>
      {!readonly && value > 0 && (
        <div
          style={{
            fontSize: "11px",
            color: "#f5a623",
            textAlign: "right",
            fontWeight: "500",
          }}
        >
          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
        </div>
      )}
      {readonly && value > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span
            style={{ fontSize: "12px", color: "#f5a623", fontWeight: "600" }}
          >
            {value.toFixed(1)}
          </span>
          <span style={{ fontSize: "11px", color: "#aaa" }}>avg</span>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }) {
  const overall =
    PARAMETERS.reduce((sum, p) => sum + (review.ratings[p.id] || 0), 0) /
    PARAMETERS.length;
  return (
    <div
      style={{
        background: "#fafafa",
        border: "1px solid #f0f0f0",
        borderRadius: "12px",
        padding: "14px 16px",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#1a1a2e",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            {review.name ? review.name[0].toUpperCase() : "A"}
          </div>
          <div>
            <div
              style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a" }}
            >
              {review.name || "Anonymous"}
            </div>
            <div style={{ fontSize: "11px", color: "#aaa" }}>
              {review.role || "Reader"}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{ fontSize: "18px", fontWeight: "700", color: "#f5a623" }}
          >
            {overall.toFixed(1)}
            <span
              style={{ fontSize: "12px", color: "#aaa", fontWeight: "400" }}
            >
              {" "}
              / 5
            </span>
          </div>
          <div style={{ fontSize: "10px", color: "#aaa" }}>overall avg</div>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px 16px",
        }}
      >
        {PARAMETERS.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "#666" }}>{p.label}</span>
            <span style={{ color: "#f5a623", fontWeight: "600" }}>
              {"★".repeat(review.ratings[p.id] || 0)}
              {"☆".repeat(5 - (review.ratings[p.id] || 0))}
            </span>
          </div>
        ))}
      </div>
      {review.comment && (
        <div
          style={{
            marginTop: "10px",
            fontSize: "13px",
            color: "#444",
            fontStyle: "italic",
            borderLeft: "3px solid #f5a623",
            paddingLeft: "10px",
            lineHeight: "1.5",
          }}
        >
          "{review.comment}"
        </div>
      )}
    </div>
  );
}

export default function ByajReviewWidget() {
  const [reviews, setReviews] = useState([]);
  const [ratings, setRatings] = useState({
    problem: 0,
    market: 0,
    founder: 0,
    execution: 0,
    investability: 0,
  });
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState("rate");

  useEffect(() => {
    setReviews(loadReviews());
  }, []);

  const aggregates = computeAggregates(reviews);
  const totalReviews = reviews.length;
  const allRated = PARAMETERS.every((p) => ratings[p.id] > 0);

  function handleRate(paramId, star) {
    setRatings((prev) => ({ ...prev, [paramId]: star }));
  }

  function handleSubmit() {
    if (!allRated) return;
    const newReview = {
      id: Date.now(),
      name: name.trim() || "Anonymous",
      role: role.trim() || "Reader",
      ratings: { ...ratings },
      comment: comment.trim(),
      date: new Date().toISOString(),
    };
    const updated = [newReview, ...reviews];
    setReviews(updated);
    saveReviews(updated);
    setSubmitted(true);
    setActiveTab("reviews");
  }

  const overallAvg = aggregates
    ? (
        PARAMETERS.reduce((sum, p) => sum + aggregates[p.id], 0) /
        PARAMETERS.length
      ).toFixed(1)
    : null;

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        maxWidth: "680px",
        margin: "0 auto",
        padding: "0 0 48px",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: "16px 16px 0 0",
          padding: "24px 28px 20px",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "2px",
            color: "#f5a623",
            fontWeight: "600",
            marginBottom: "6px",
            textTransform: "uppercase",
          }}
        >
          NoCap VC · Pitch Review
        </div>
        <div
          style={{ fontSize: "22px", fontWeight: "700", marginBottom: "4px" }}
        >
          Rate the BYAJ Pitch
        </div>
        <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "16px" }}>
          How would you evaluate this fintech concept?
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: "24px" }}>
          <div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#f5a623",
                lineHeight: 1,
              }}
            >
              {overallAvg || "—"}
            </div>
            <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
              avg rating
            </div>
          </div>
          <div
            style={{
              width: "1px",
              background: "#333",
              alignSelf: "stretch",
            }}
          />
          <div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {totalReviews}
            </div>
            <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
              {totalReviews === 1 ? "review" : "reviews"}
            </div>
          </div>
          {aggregates && (
            <>
              <div
                style={{
                  width: "1px",
                  background: "#333",
                  alignSelf: "stretch",
                }}
              />
              <div style={{ flex: 1 }}>
                {PARAMETERS.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "3px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#888",
                        width: "64px",
                        flexShrink: 0,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.label.split(" ")[0]}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: "4px",
                        background: "#333",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(aggregates[p.id] / 5) * 100}%`,
                          height: "100%",
                          background: "#f5a623",
                          borderRadius: "2px",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#f5a623",
                        fontWeight: "600",
                        width: "24px",
                        textAlign: "right",
                      }}
                    >
                      {aggregates[p.id].toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          background: "#f7f7f7",
          borderLeft: "1px solid #e8e8e8",
          borderRight: "1px solid #e8e8e8",
        }}
      >
        {[
          { id: "rate", label: submitted ? "✓ Rated" : "Rate This Pitch" },
          { id: "reviews", label: `Reviews (${totalReviews})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              background: activeTab === tab.id ? "#fff" : "transparent",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #f5a623"
                  : "2px solid transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: activeTab === tab.id ? "600" : "400",
              color: activeTab === tab.id ? "#1a1a2e" : "#888",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8e8e8",
          borderTop: "none",
          borderRadius: "0 0 16px 16px",
          padding: "20px 24px 24px",
        }}
      >
        {/* RATE TAB */}
        {activeTab === "rate" && !submitted && (
          <div>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
              Rate each parameter independently. All 5 required to submit.
            </div>
            {PARAMETERS.map((p) => (
              <StarRow
                key={p.id}
                paramId={p.id}
                label={p.label}
                description={p.description}
                value={ratings[p.id]}
                onChange={handleRate}
                readonly={false}
              />
            ))}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Your name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul S."
                  maxLength={40}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  You are a...
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                    background: "#fff",
                    fontFamily: "inherit",
                    color: role ? "#1a1a1a" : "#aaa",
                  }}
                >
                  <option value="">Select role</option>
                  <option value="Investor / VC">Investor / VC</option>
                  <option value="Startup Founder">Startup Founder</option>
                  <option value="Retail Investor">Retail Investor</option>
                  <option value="Finance Professional">Finance Professional</option>
                  <option value="Fintech Enthusiast">Fintech Enthusiast</option>
                  <option value="Student">Student</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "10px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#666",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Quick take (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What excites you or concerns you about BYAJ?"
                maxLength={300}
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "13px",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  lineHeight: "1.5",
                }}
              />
              <div
                style={{
                  fontSize: "11px",
                  color: "#bbb",
                  textAlign: "right",
                  marginTop: "2px",
                }}
              >
                {comment.length}/300
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!allRated}
              style={{
                width: "100%",
                marginTop: "16px",
                padding: "14px",
                background: allRated ? "#1a1a2e" : "#f0f0f0",
                color: allRated ? "#fff" : "#bbb",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: allRated ? "pointer" : "not-allowed",
                transition: "background 0.2s, transform 0.1s",
                fontFamily: "inherit",
              }}
              onMouseDown={(e) => {
                if (allRated) e.currentTarget.style.transform = "scale(0.98)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {allRated
                ? "Submit Review →"
                : `Rate all 5 parameters to submit (${
                    PARAMETERS.filter((p) => ratings[p.id] > 0).length
                  }/5 done)`}
            </button>
          </div>
        )}

        {/* SUBMITTED STATE */}
        {activeTab === "rate" && submitted && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎯</div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1a1a2e",
                marginBottom: "6px",
              }}
            >
              Review submitted!
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#888",
                marginBottom: "20px",
                lineHeight: "1.6",
              }}
            >
              Your rating has been added to the aggregate.
              <br />
              The community sees it live below.
            </div>
            <button
              onClick={() => setActiveTab("reviews")}
              style={{
                padding: "10px 24px",
                background: "#f5a623",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              See all reviews →
            </button>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === "reviews" && (
          <div>
            {reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
                <div style={{ fontSize: "36px", marginBottom: "10px" }}>⭐</div>
                <div style={{ fontSize: "14px", fontWeight: "600" }}>
                  No reviews yet
                </div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                  Be the first to rate the BYAJ pitch
                </div>
                <button
                  onClick={() => setActiveTab("rate")}
                  style={{
                    marginTop: "14px",
                    padding: "8px 20px",
                    background: "#1a1a2e",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Rate now →
                </button>
              </div>
            ) : (
              <>
                {aggregates && (
                  <div
                    style={{
                      background: "#fffbf0",
                      border: "1px solid #f5e6b8",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#b8860b",
                        fontWeight: "600",
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Community Verdict · {totalReviews}{" "}
                      {totalReviews === 1 ? "review" : "reviews"}
                    </div>
                    {PARAMETERS.map((p) => (
                      <StarRow
                        key={p.id}
                        paramId={p.id}
                        label={p.label}
                        description={p.description}
                        value={aggregates[p.id]}
                        onChange={() => {}}
                        readonly={true}
                      />
                    ))}
                  </div>
                )}

                {displayedReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}

                {reviews.length > 3 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "none",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#666",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      marginTop: "4px",
                    }}
                  >
                    {showAll
                      ? "Show fewer reviews"
                      : `Show all ${reviews.length} reviews`}
                  </button>
                )}

                {!submitted && (
                  <button
                    onClick={() => setActiveTab("rate")}
                    style={{
                      width: "100%",
                      marginTop: "12px",
                      padding: "12px",
                      background: "#1a1a2e",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Add your rating →
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: "12px",
          fontSize: "11px",
          color: "#bbb",
        }}
      >
        Powered by{" "}
        <a
          href="https://nocapvc.in"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#f5a623", textDecoration: "none", fontWeight: "600" }}
        >
          NoCap VC
        </a>{" "}
        · Reviews stored locally in your browser
      </div>
    </div>
  );
}
