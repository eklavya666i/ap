// The 75 lessons in 10 units. Lessons marked 1 in the fourth place were added from Common Core grade 6.
// Lesson content (scripts, templates, models) lives in units/uNN.js, one file per unit, so parallel branches never edit the same file.
const CURRICULUM = [
  {u: 1, title: "Ratios & Rates", stars: 3, ccss: "6.RP.A.1–3", color: "#1d4ed8", lessons: [
    ["1.1", "What a ratio means", "6.RP.A.1"], ["1.2", "Equivalent ratios", "6.RP.A.3a"], ["1.3", "Ratio tables and double number lines", "6.RP.A.3a"],
    ["1.4", "Comparing ratios", "6.RP.A.3a"], ["1.5", "Unit rates", "6.RP.A.2"], ["1.6", "Unit price and better buys", "6.RP.A.3b"],
    ["1.7", "Speed, distance and time", "6.RP.A.3b"], ["1.8", "Percent as a rate per 100", "6.RP.A.3c"], ["1.9", "Percent of a number", "6.RP.A.3c"],
    ["1.10", "Finding the whole from a percent", "6.RP.A.3c"], ["1.11", "Converting measurements with ratios", "6.RP.A.3d"], ["1.12", "Ratio word problems and graphs", "6.RP.A.3a"]]},
  {u: 2, title: "Fractions", stars: 3, ccss: "6.NS.A.1", color: "#7c3aed", lessons: [
    ["2.1", "Multiplying fractions", "5.NF.B.4"], ["2.2", "Multiplying mixed numbers", "5.NF.B.6"], ["2.3", "What division means", "6.NS.A.1"],
    ["2.4", "Dividing with whole numbers and unit fractions", "6.NS.A.1"], ["2.5", "Fraction ÷ fraction", "6.NS.A.1"],
    ["2.6", "Dividing mixed numbers", "6.NS.A.1"], ["2.7", "Fraction word problems", "6.NS.A.1"]]},
  {u: 3, title: "Decimals", stars: 3, ccss: "6.NS.B.2–3", color: "#0f766e", lessons: [
    ["3.1", "Place value and estimating", "6.NS.B.3"], ["3.2", "Adding and subtracting decimals", "6.NS.B.3"], ["3.3", "Multiplying decimals", "6.NS.B.3"],
    ["3.4", "Long division with whole numbers", "6.NS.B.2", 1], ["3.5", "Dividing decimals by whole numbers", "6.NS.B.3"],
    ["3.6", "Dividing by a decimal", "6.NS.B.3"], ["3.7", "Money and decimal word problems", "6.NS.B.3"]]},
  {u: 4, title: "Integers & Negative Numbers", stars: 3, ccss: "6.NS.C.5–7", color: "#0369a1", lessons: [
    ["4.1", "Negative numbers in real life", "6.NS.C.5"], ["4.2", "Number lines and opposites", "6.NS.C.6a"], ["4.3", "Comparing integers", "6.NS.C.7a"],
    ["4.4", "Ordering integers", "6.NS.C.7b"], ["4.5", "Absolute value", "6.NS.C.7c"], ["4.6", "Absolute value in context", "6.NS.C.7d"],
    ["4.7", "Negative fractions and decimals", "6.NS.C.6c", 1]]},
  {u: 5, title: "Factors & Multiples", stars: 1, ccss: "6.NS.B.4", color: "#b45309", lessons: [
    ["5.1", "Factors, multiples and divisibility", "4.OA.B.4"], ["5.2", "Prime and composite numbers", "4.OA.B.4"], ["5.3", "Prime factorization", "6.NS.B.4"],
    ["5.4", "Greatest common factor", "6.NS.B.4"], ["5.5", "Least common multiple", "6.NS.B.4"], ["5.6", "GCF, the distributive property and word problems", "6.NS.B.4"]]},
  {u: 6, title: "Algebraic Expressions", stars: 3, ccss: "6.EE.A.1–4", color: "#be123c", lessons: [
    ["6.1", "Exponents", "6.EE.A.1", 1], ["6.2", "Order of operations", "6.EE.A.2c"], ["6.3", "Parts of an expression", "6.EE.A.2b"],
    ["6.4", "Writing expressions from words", "6.EE.A.2a"], ["6.5", "Evaluating expressions and formulas", "6.EE.A.2c"],
    ["6.6", "The distributive property", "6.EE.A.3"], ["6.7", "Equivalent expressions and like terms", "6.EE.A.4", 1]]},
  {u: 7, title: "Equations & Inequalities", stars: 3, ccss: "6.EE.B.5–8, 6.EE.C.9", color: "#a21caf", lessons: [
    ["7.1", "What a solution is", "6.EE.B.5"], ["7.2", "Writing equations from situations", "6.EE.B.7"], ["7.3", "Addition and subtraction equations", "6.EE.B.7"],
    ["7.4", "Multiplication and division equations", "6.EE.B.7"], ["7.5", "Equation word problems", "6.EE.B.7"],
    ["7.6", "Inequalities", "6.EE.B.8", 1], ["7.7", "Dependent and independent variables", "6.EE.C.9", 1]]},
  {u: 8, title: "Coordinate Plane", stars: 2, ccss: "6.NS.C.6, 6.NS.C.8, 6.G.A.3", color: "#15803d", lessons: [
    ["8.1", "Axes, origin and ordered pairs", "6.NS.C.6c"], ["8.2", "Plotting and reading points in four quadrants", "6.NS.C.6c"],
    ["8.3", "Quadrants and reflections", "6.NS.C.6b"], ["8.4", "Distance between points", "6.NS.C.8", 1],
    ["8.5", "Polygons on the coordinate plane", "6.G.A.3", 1], ["8.6", "Plotting relationships from tables", "6.RP.A.3a"]]},
  {u: 9, title: "Geometry", stars: 3, ccss: "6.G.A.1–4", color: "#c2410c", lessons: [
    ["9.1", "Rectangles and parallelograms", "6.G.A.1"], ["9.2", "Triangles", "6.G.A.1"], ["9.3", "Trapezoids", "6.G.A.1"],
    ["9.4", "Composite shapes and polygons", "6.G.A.1"], ["9.5", "Nets", "6.G.A.4", 1], ["9.6", "Surface area", "6.G.A.4"],
    ["9.7", "Volume of rectangular prisms", "6.G.A.2"], ["9.8", "Geometry word problems and vocabulary", "6.G.A.1"]]},
  {u: 10, title: "Statistics & Data", stars: 3, ccss: "6.SP.A.1–3, 6.SP.B.4–5", color: "#4d7c0f", lessons: [
    ["10.1", "Statistical questions and collecting data", "6.SP.A.1", 1], ["10.2", "Frequency tables and dot plots", "6.SP.B.4"],
    ["10.3", "Histograms", "6.SP.B.4", 1], ["10.4", "Mean", "6.SP.A.3"], ["10.5", "Median, mode and range", "6.SP.A.3"],
    ["10.6", "Box plots, quartiles and IQR", "6.SP.B.4"], ["10.7", "Mean absolute deviation", "6.SP.B.5c", 1], ["10.8", "Shape, outliers and conclusions", "6.SP.A.2"]]}
];
if (typeof module !== "undefined") module.exports = CURRICULUM;
