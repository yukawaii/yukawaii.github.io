"use strict";
/**
 * JigsawPuzzle - A refactored, reusable jigsaw puzzle game class
 * 
 * Stripped of all UI code, providing a clean interface for integration.
 * 
 * @example
 * const puzzle = new JigsawPuzzle('my-container-id', {
 *   image: 'https://example.com/image.jpg',
 *   numPieces: 20,
 *   shapeType: 0,
 *   allowRotation: true
 * });
 * 
 * puzzle.start();
 */

// ============================================================================
// Constants
// ============================================================================

const FILE_EXTENSION = ".puz";
const FILE_SIGNATURE = "pzfilecct";

// Math shortcuts
const mhypot = Math.hypot,
  mrandom = Math.random,
  mmax = Math.max,
  mmin = Math.min,
  mround = Math.round,
  mfloor = Math.floor,
  mceil = Math.ceil,
  msqrt = Math.sqrt,
  mabs = Math.abs;

// ============================================================================
// Utility Functions
// ============================================================================

function alea(min, max) {
  if (typeof max == "undefined") return min * mrandom();
  return min + (max - min) * mrandom();
}

function intAlea(min, max) {
  if (typeof max == "undefined") {
    max = min;
    min = 0;
  }
  return mfloor(min + (max - min) * mrandom());
}

function arrayShuffle(array) {
  let k1, temp;
  for (let k = array.length - 1; k >= 1; --k) {
    k1 = intAlea(0, k + 1);
    temp = array[k];
    array[k] = array[k1];
    array[k1] = temp;
  }
  return array;
}

// ============================================================================
// Pseudo-Random Number Generator
// ============================================================================

function mMash(seed) {
  let n = 0xefc8249d;
  let intSeed = (seed || Math.random()).toString();

  function mash(data) {
    if (data) {
      data = data.toString();
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000;
      }
      return (n >>> 0) * 2.3283064365386963e-10;
    }
    n = 0xefc8249d;
    return (n >>> 0) * 2.3283064365386963e-10;
  }
  n = mash(intSeed);

  var x = function () {
    n += 0x9e3779b9;
    var h = 0x0274ebd7 * n;
    return (h >>> 0) * 2.3283064365386963e-10;
  };

  x.intAlea = function (min, max) {
    if (typeof max == "undefined") {
      max = min;
      min = 0;
    }
    return mfloor(min + (max - min) * x());
  };

  x.alea = function (min, max) {
    if (typeof max == "undefined") return min * x();
    return min + (max - min) * x();
  };

  x.reset = function () {
    n = 0xefc8249d;
    n = mash(intSeed);
  };

  x.seed = intSeed;
  return x;
}

// ============================================================================
// Core Geometry Classes
// ============================================================================

class Point {
  constructor(x, y) {
    this.x = Number(x);
    this.y = Number(y);
  }
  copy() {
    return new Point(this.x, this.y);
  }
  distance(otherPoint) {
    return mhypot(this.x - otherPoint.x, this.y - otherPoint.y);
  }
}

class Segment {
  constructor(p1, p2) {
    this.p1 = new Point(p1.x, p1.y);
    this.p2 = new Point(p2.x, p2.y);
  }
  dx() {
    return this.p2.x - this.p1.x;
  }
  dy() {
    return this.p2.y - this.p1.y;
  }
  length() {
    return mhypot(this.dx(), this.dy());
  }
  pointOnRelative(coeff) {
    let dx = this.dx();
    let dy = this.dy();
    return new Point(this.p1.x + coeff * dx, this.p1.y + coeff * dy);
  }
}

class Side {
  constructor() {
    this.type = "";
    this.points = [];
  }

  reversed() {
    const ns = new Side();
    ns.type = this.type;
    ns.points = this.points.slice().reverse();
    return ns;
  }

  scale(puzzle) {
    const coefx = puzzle.scalex;
    const coefy = puzzle.scaley;
    this.scaledPoints = this.points.map(
      (p) => new Point(p.x * coefx, p.y * coefy)
    );
  }

  drawPath(ctx, shiftx, shifty, withoutMoveTo) {
    if (!withoutMoveTo) {
      ctx.moveTo(
        this.scaledPoints[0].x + shiftx,
        this.scaledPoints[0].y + shifty
      );
    }
    if (this.type == "d") {
      ctx.lineTo(
        this.scaledPoints[1].x + shiftx,
        this.scaledPoints[1].y + shifty
      );
    } else {
      for (let k = 1; k < this.scaledPoints.length - 1; k += 3) {
        ctx.bezierCurveTo(
          this.scaledPoints[k].x + shiftx,
          this.scaledPoints[k].y + shifty,
          this.scaledPoints[k + 1].x + shiftx,
          this.scaledPoints[k + 1].y + shifty,
          this.scaledPoints[k + 2].x + shiftx,
          this.scaledPoints[k + 2].y + shifty
        );
      }
    }
  }
}

// ============================================================================
// Piece Shape Functions (twist functions)
// ============================================================================

function twist0(side, ca, cb, prng) {
  const seg0 = new Segment(side.points[0], side.points[1]);
  const dxh = seg0.dx();
  const dyh = seg0.dy();

  const seg1 = new Segment(ca, cb);
  const mid0 = seg0.pointOnRelative(0.5);
  const mid1 = seg1.pointOnRelative(0.5);

  const segMid = new Segment(mid0, mid1);
  const dxv = segMid.dx();
  const dyv = segMid.dy();

  const scalex = prng.alea(0.8, 1);
  const scaley = prng.alea(0.9, 1);
  const mid = prng.alea(0.45, 0.55);

  const pa = pointAt(mid - (1 / 12) * scalex, (1 / 12) * scaley);
  const pb = pointAt(mid - (2 / 12) * scalex, (3 / 12) * scaley);
  const pc = pointAt(mid, (4 / 12) * scaley);
  const pd = pointAt(mid + (2 / 12) * scalex, (3 / 12) * scaley);
  const pe = pointAt(mid + (1 / 12) * scalex, (1 / 12) * scaley);

  side.points = [
    seg0.p1,
    new Point(
      seg0.p1.x + (5 / 12) * dxh * 0.52,
      seg0.p1.y + (5 / 12) * dyh * 0.52
    ),
    new Point(pa.x - (1 / 12) * dxv * 0.72, pa.y - (1 / 12) * dyv * 0.72),
    pa,
    new Point(pa.x + (1 / 12) * dxv * 0.72, pa.y + (1 / 12) * dyv * 0.72),
    new Point(pb.x - (1 / 12) * dxv * 0.92, pb.y - (1 / 12) * dyv * 0.92),
    pb,
    new Point(pb.x + (1 / 12) * dxv * 0.52, pb.y + (1 / 12) * dyv * 0.52),
    new Point(pc.x - (2 / 12) * dxh * 0.4, pc.y - (2 / 12) * dyh * 0.4),
    pc,
    new Point(pc.x + (2 / 12) * dxh * 0.4, pc.y + (2 / 12) * dyh * 0.4),
    new Point(pd.x + (1 / 12) * dxv * 0.52, pd.y + (1 / 12) * dyv * 0.52),
    pd,
    new Point(pd.x - (1 / 12) * dxv * 0.92, pd.y - (1 / 12) * dyv * 0.92),
    new Point(pe.x + (1 / 12) * dxv * 0.72, pe.y + (1 / 12) * dyv * 0.72),
    pe,
    new Point(pe.x - (1 / 12) * dxv * 0.72, pe.y - (1 / 12) * dyv * 0.72),
    new Point(
      seg0.p2.x - (5 / 12) * dxh * 0.52,
      seg0.p2.y - (5 / 12) * dyh * 0.52
    ),
    seg0.p2
  ];
  side.type = "z";

  function pointAt(coeffh, coeffv) {
    return new Point(
      seg0.p1.x + coeffh * dxh + coeffv * dxv,
      seg0.p1.y + coeffh * dyh + coeffv * dyv
    );
  }
}

function twist1(side, ca, cb, prng) {
  const seg0 = new Segment(side.points[0], side.points[1]);
  const dxh = seg0.dx();
  const dyh = seg0.dy();

  const seg1 = new Segment(ca, cb);
  const mid0 = seg0.pointOnRelative(0.5);
  const mid1 = seg1.pointOnRelative(0.5);

  const segMid = new Segment(mid0, mid1);
  const dxv = segMid.dx();
  const dyv = segMid.dy();

  const pa = pointAt(
    prng.alea(0.3, 0.35),
    prng.alea(-0.05, 0.05)
  );
  const pb = pointAt(prng.alea(0.45, 0.55), prng.alea(0.2, 0.3));
  const pc = pointAt(
    prng.alea(0.65, 0.78),
    prng.alea(-0.05, 0.05)
  );

  side.points = [
    seg0.p1,
    seg0.p1,
    pa,
    pa,
    pa,
    pb,
    pb,
    pb,
    pc,
    pc,
    pc,
    seg0.p2,
    seg0.p2
  ];
  side.type = "z";

  function pointAt(coeffh, coeffv) {
    return new Point(
      seg0.p1.x + coeffh * dxh + coeffv * dxv,
      seg0.p1.y + coeffh * dyh + coeffv * dyv
    );
  }
}

function twist2(side, ca, cb, prng) {
  const seg0 = new Segment(side.points[0], side.points[1]);
  const dxh = seg0.dx();
  const dyh = seg0.dy();

  const seg1 = new Segment(ca, cb);
  const mid0 = seg0.pointOnRelative(0.5);
  const mid1 = seg1.pointOnRelative(0.5);

  const segMid = new Segment(mid0, mid1);
  const dxv = segMid.dx();
  const dyv = segMid.dy();

  const hmid = prng.alea(0.45, 0.55);
  const vmid = prng.alea(0.4, 0.5);
  const pc = pointAt(hmid, vmid);
  let sega = new Segment(seg0.p1, pc);

  const pb = sega.pointOnRelative(2 / 3);
  sega = new Segment(seg0.p2, pc);
  const pd = sega.pointOnRelative(2 / 3);

  side.points = [seg0.p1, pb, pd, seg0.p2];
  side.type = "z";

  function pointAt(coeffh, coeffv) {
    return new Point(
      seg0.p1.x + coeffh * dxh + coeffv * dxv,
      seg0.p1.y + coeffh * dyh + coeffv * dyv
    );
  }
}

function twist3(side, ca, cb, prng) {
  side.points = [side.points[0], side.points[1]];
}

// ============================================================================
// Piece Classes
// ============================================================================

class Piece {
  constructor(kx, ky) {
    this.ts = new Side();
    this.rs = new Side();
    this.bs = new Side();
    this.ls = new Side();
    this.kx = kx;
    this.ky = ky;
  }

  scale(puzzleInstance) {
    this.ts.scale(puzzleInstance);
    this.rs.scale(puzzleInstance);
    this.bs.scale(puzzleInstance);
    this.ls.scale(puzzleInstance);
  }
}

// ============================================================================
// PolyPiece Class (needs puzzle instance reference)
// ============================================================================

class PolyPiece {
  constructor(initialPiece, puzzleInstance) {
    this.puzzle = puzzleInstance;
    this.pckxmin = initialPiece.kx;
    this.pckxmax = initialPiece.kx + 1;
    this.pckymin = initialPiece.ky;
    this.pckymax = initialPiece.ky + 1;
    this.pieces = [initialPiece];
    this.selected = false;
    this.listLoops();

    this.canvas = document.createElement("CANVAS");
    this.puzzle.container.appendChild(this.canvas);
    this.canvas.classList.add("polypiece");
    this.ctx = this.canvas.getContext("2d");
    this.rot = 0;
  }

  merge(otherPoly) {
    const puzzle = this.puzzle;
    const orgpckxmin = this.pckxmin;
    const orgpckymin = this.pckymin;
    const pbefore = getTransformed(
      0,
      0,
      this.nx * puzzle.scalex,
      this.ny * puzzle.scaley,
      this.rot
    );

    const kOther = puzzle.polyPieces.indexOf(otherPoly);
    puzzle.polyPieces.splice(kOther, 1);
    puzzle.container.removeChild(otherPoly.canvas);

    for (let k = 0; k < otherPoly.pieces.length; ++k) {
      this.pieces.push(otherPoly.pieces[k]);
      if (otherPoly.pieces[k].kx < this.pckxmin)
        this.pckxmin = otherPoly.pieces[k].kx;
      if (otherPoly.pieces[k].kx + 1 > this.pckxmax)
        this.pckxmax = otherPoly.pieces[k].kx + 1;
      if (otherPoly.pieces[k].ky < this.pckymin)
        this.pckymin = otherPoly.pieces[k].ky;
      if (otherPoly.pieces[k].ky + 1 > this.pckymax)
        this.pckymax = otherPoly.pieces[k].ky + 1;
    }

    this.pieces.sort(function (p1, p2) {
      if (p1.ky < p2.ky) return -1;
      if (p1.ky > p2.ky) return 1;
      if (p1.kx < p2.kx) return -1;
      if (p1.kx > p2.kx) return 1;
      return 0;
    });

    this.listLoops();
    this.drawImage();

    const pafter = getTransformed(
      puzzle.scalex * (orgpckxmin - this.pckxmin),
      puzzle.scaley * (orgpckymin - this.pckymin),
      puzzle.scalex * (this.pckxmax - this.pckxmin + 1),
      puzzle.scaley * (this.pckymax - this.pckymin + 1),
      this.rot
    );

    this.moveTo(this.x - pafter.x + pbefore.x, this.y - pafter.y + pbefore.y);
    puzzle.evaluateZIndex();

    function getTransformed(orgx, orgy, width, height, rot) {
      const dx = orgx - width / 2;
      const dy = orgy - height / 2;
      return {
        x: width / 2 + [1, 0, -1, 0][rot] * dx + [0, -1, 0, 1][rot] * dy,
        y: height / 2 + [0, 1, 0, -1][rot] * dx + [1, 0, -1, 0][rot] * dy
      };
    }
  }

  ifNear(otherPoly) {
    const puzzle = this.puzzle;
    if (this.rot != otherPoly.rot) return false;

    let p1, p2;
    let org = this.getOrgP();
    let orgOther = otherPoly.getOrgP();

    if (mhypot(org.x - orgOther.x, org.y - orgOther.y) >= puzzle.dConnect)
      return false;

    for (let k = this.pieces.length - 1; k >= 0; --k) {
      p1 = this.pieces[k];
      for (let ko = otherPoly.pieces.length - 1; ko >= 0; --ko) {
        p2 = otherPoly.pieces[ko];
        if (p1.kx == p2.kx && mabs(p1.ky - p2.ky) == 1) return true;
        if (p1.ky == p2.ky && mabs(p1.kx - p2.kx) == 1) return true;
      }
    }

    return false;
  }

  listLoops() {
    const that = this;
    function edgeIsCommon(kx, ky, edge) {
      let k;
      switch (edge) {
        case 0: ky--; break;
        case 1: kx++; break;
        case 2: ky++; break;
        case 3: kx--; break;
      }
      for (k = 0; k < that.pieces.length; k++) {
        if (kx == that.pieces[k].kx && ky == that.pieces[k].ky) return true;
      }
      return false;
    }

    function edgeIsInTbEdges(kx, ky, edge) {
      let k;
      for (k = 0; k < tbEdges.length; k++) {
        if (
          kx == tbEdges[k].kx &&
          ky == tbEdges[k].ky &&
          edge == tbEdges[k].edge
        )
          return k;
      }
      return false;
    }

    let tbLoops = [];
    let tbEdges = [];
    let k;
    let kEdge;
    let lp;
    let currEdge;
    let tries;
    let edgeNumber;
    let potNext;

    let tbTries = [
      [
        { dkx: 0, dky: 0, edge: 1 },
        { dkx: 1, dky: 0, edge: 0 },
        { dkx: 1, dky: -1, edge: 3 }
      ],
      [
        { dkx: 0, dky: 0, edge: 2 },
        { dkx: 0, dky: 1, edge: 1 },
        { dkx: 1, dky: 1, edge: 0 }
      ],
      [
        { dkx: 0, dky: 0, edge: 3 },
        { dkx: -1, dky: 0, edge: 2 },
        { dkx: -1, dky: 1, edge: 1 }
      ],
      [
        { dkx: 0, dky: 0, edge: 0 },
        { dkx: 0, dky: -1, edge: 3 },
        { dkx: -1, dky: -1, edge: 2 }
      ]
    ];

    for (k = 0; k < this.pieces.length; k++) {
      for (kEdge = 0; kEdge < 4; kEdge++) {
        if (!edgeIsCommon(this.pieces[k].kx, this.pieces[k].ky, kEdge))
          tbEdges.push({
            kx: this.pieces[k].kx,
            ky: this.pieces[k].ky,
            edge: kEdge,
            kp: k
          });
      }
    }

    while (tbEdges.length > 0) {
      lp = [];
      currEdge = tbEdges[0];
      lp.push(currEdge);
      tbEdges.splice(0, 1);
      do {
        for (tries = 0; tries < 3; tries++) {
          potNext = tbTries[currEdge.edge][tries];
          edgeNumber = edgeIsInTbEdges(
            currEdge.kx + potNext.dkx,
            currEdge.ky + potNext.dky,
            potNext.edge
          );
          if (edgeNumber === false) continue;
          currEdge = tbEdges[edgeNumber];
          lp.push(currEdge);
          tbEdges.splice(edgeNumber, 1);
          break;
        }
        if (edgeNumber === false) break;
      } while (1);
      tbLoops.push(lp);
    }

    this.tbLoops = tbLoops.map((loop) =>
      loop.map((edge) => {
        let cell = this.pieces[edge.kp];
        if (edge.edge == 0) return cell.ts;
        if (edge.edge == 1) return cell.rs;
        if (edge.edge == 2) return cell.bs;
        return cell.ls;
      })
    );
  }

  getRect() {
    const puzzle = this.puzzle;
    let rect0 = puzzle.container.getBoundingClientRect();
    let rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.x - rect0.x,
      y: rect.y - rect0.y,
      right: rect.right - rect0.x,
      bottom: rect.bottom - rect0.y,
      width: rect.width,
      height: rect.height
    };
  }

  getOrgP() {
    const puzzle = this.puzzle;
    const rect = this.getRect();
    switch (this.rot) {
      case 0:
        return {
          x: rect.x - puzzle.scalex * this.pckxmin,
          y: rect.y - puzzle.scaley * this.pckymin
        };
      case 1:
        return {
          x: rect.right + puzzle.scaley * this.pckymin,
          y: rect.y - puzzle.scalex * this.pckxmin
        };
      case 2:
        return {
          x: rect.right + puzzle.scalex * this.pckxmin,
          y: rect.bottom + puzzle.scaley * this.pckymin
        };
      case 3:
        return {
          x: rect.x - puzzle.scaley * this.pckymin,
          y: rect.bottom + puzzle.scalex * this.pckxmin
        };
    }
  }

  drawPath(ctx, shiftx, shifty) {
    this.tbLoops.forEach((loop) => {
      let without = false;
      loop.forEach((side) => {
        side.drawPath(ctx, shiftx, shifty, without);
        without = true;
      });
      ctx.closePath();
    });
  }

  drawImage(special) {
    const puzzle = this.puzzle;
      // ★ Защита от нулевых размеров
    if (!puzzle.gameCanvas || puzzle.gameCanvas.width === 0 || puzzle.gameCanvas.height === 0) {
        console.warn('[PolyPiece] drawImage: gameCanvas has zero size, skipping');
        return;
    }
    this.nx = this.pckxmax - this.pckxmin + 1;
    this.ny = this.pckymax - this.pckymin + 1;
    this.canvas.width = this.nx * puzzle.scalex;
    this.canvas.height = this.ny * puzzle.scaley;

    this.offsx = (this.pckxmin - 0.5) * puzzle.scalex;
    this.offsy = (this.pckymin - 0.5) * puzzle.scaley;

    this.path = new Path2D();
    this.drawPath(this.path, -this.offsx, -this.offsy);

    this.ctx.fillStyle = "none";
     if (!Device.isLowPerformance) {
    const selectedBlur = Device.isMobile ? mmin(4, puzzle.scalex / 10) : mmin(8, puzzle.scalex / 10);
    const defaultBlur = Device.isMobile ? 2 : 4;
    this.ctx.shadowColor = this.selected
        ? special
      ? "#5cb84a"   // изумрудный зелёный
        : "#e08a30"   // янтарно-оранжевый
   : "rgba(0, 0, 0, 0.5)";
    this.ctx.shadowBlur = this.selected ? selectedBlur : defaultBlur;
    this.ctx.shadowOffsetX = this.selected ? 0 : -4;
    this.ctx.shadowOffsetY = this.selected ? 0 : 4;
} else {
    // на слабых устройствах тени отключаем
    this.ctx.shadowColor = 'rgba(0,0,0,0)';
    this.ctx.shadowBlur = 0;
}
    this.ctx.fill(this.path);
    if (this.selected) {
      for (let i = 0; i < 6; i++) this.ctx.fill(this.path);
    }
    this.ctx.shadowColor = "rgba(0, 0, 0, 0)";

    this.pieces.forEach((pp) => {
      this.ctx.save();

      const path = new Path2D();
      const shiftx = -this.offsx;
      const shifty = -this.offsy;
      pp.ts.drawPath(path, shiftx, shifty, false);
      pp.rs.drawPath(path, shiftx, shifty, true);
      pp.bs.drawPath(path, shiftx, shifty, true);
      pp.ls.drawPath(path, shiftx, shifty, true);
      path.closePath();

      this.ctx.clip(path);
      const srcx = pp.kx ? (pp.kx - 0.5) * puzzle.scalex : 0;
      const srcy = pp.ky ? (pp.ky - 0.5) * puzzle.scaley : 0;

      const destx =
        (pp.kx ? 0 : puzzle.scalex / 2) +
        (pp.kx - this.pckxmin) * puzzle.scalex;
      const desty =
        (pp.ky ? 0 : puzzle.scaley / 2) +
        (pp.ky - this.pckymin) * puzzle.scaley;

      let w = 2 * puzzle.scalex;
      let h = 2 * puzzle.scaley;
      if (srcx + w > puzzle.gameCanvas.width)
        w = puzzle.gameCanvas.width - srcx;
      if (srcy + h > puzzle.gameCanvas.height)
        h = puzzle.gameCanvas.height - srcy;

      this.ctx.drawImage(
        puzzle.gameCanvas,
        srcx,
        srcy,
        w,
        h,
        destx,
        desty,
        w,
        h
      );
      this.ctx.lineWidth = puzzle.embossThickness * 1.5;

      this.ctx.translate(
        puzzle.embossThickness / 2,
        -puzzle.embossThickness / 2
      );
      this.ctx.strokeStyle = "rgba(42, 31, 20, 0.35)";   // тёмный шоколад
      this.ctx.stroke(path);

      this.ctx.translate(-puzzle.embossThickness, puzzle.embossThickness);
      this.ctx.strokeStyle = "rgba(240, 230, 211, 0.35)"; // светлый бежевый
      this.ctx.stroke(path);

      this.ctx.restore();
      this.canvas.style.transform = `rotate(${90 * this.rot}deg)`;
    });
  }



moveTo(x, y) {
   // console.log('[PolyPiece] moveTo', x, y);
    this.x = x;
    this.y = y;
    this.canvas.style.left = x + "px";
    this.canvas.style.top = y + "px";
}

  moveToInitialPlace() {
    const puzzle = this.puzzle;
    this.moveTo(
      puzzle.offsx + (this.pckxmin - 0.5) * puzzle.scalex,
      puzzle.offsy + (this.pckymin - 0.5) * puzzle.scaley
    );
  }

  rotate(angle) {
    this.rot = angle;
  }

  isPointInPath(p) {
    let npath = new Path2D();
    this.drawPath(npath, 0, 0);
    let rect = this.getRect();

    let pRefx = [rect.x, rect.right, rect.right, rect.x][this.rot];
    let pRefy = [rect.y, rect.y, rect.bottom, rect.bottom][this.rot];

    let mposx =
      [1, 0, -1, 0][this.rot] * (p.x - pRefx) +
      [0, 1, 0, -1][this.rot] * (p.y - pRefy);
    let mposy =
      [0, -1, 0, 1][this.rot] * (p.x - pRefx) +
      [1, 0, -1, 0][this.rot] * (p.y - pRefy);

    return this.ctx.isPointInPath(this.path, mposx, mposy);
  }

  coerceToContainer() {
    const puzzle = this.puzzle;
    let dimx = [puzzle.scalex, puzzle.scaley, puzzle.scalex, puzzle.scaley][
      this.rot
    ];
    let dimy = [puzzle.scaley, puzzle.scalex, puzzle.scaley, puzzle.scalex][
      this.rot
    ];
    const rect = this.getRect();
    if (rect.y > -dimy && rect.bottom < puzzle.contHeight + dimy) {
      if (rect.right < dimx) {
        this.moveTo(this.x + dimx - rect.right, this.y);
        return;
      }
      if (rect.x > puzzle.contWidth - dimx) {
        this.moveTo(this.x + puzzle.contWidth - dimx - rect.x, this.y);
        return;
      }
      return;
    }
    if (rect.x > -dimx && rect.right < puzzle.contHeight + dimy) {
      if (rect.bottom < dimy) {
        this.moveTo(this.x, this.y + dimy - rect.bottom);
        return;
      }
      if (rect.y > puzzle.contHeight - dimy) {
        this.moveTo(this.x, this.y + puzzle.contHeight - dimy - rect.y);
        return;
      }
      return;
    }
    if (rect.y < -dimy) {
      this.moveTo(this.x, this.y - rect.y - dimy);
      this.getRect();
    }
    if (rect.bottom > puzzle.contHeight + dimy) {
      this.moveTo(this.x, this.y + puzzle.contHeight + dimy - rect.bottom);
      this.getRect();
    }
    if (rect.right < dimx) {
      this.moveTo(this.x + dimx - rect.right, this.y);
      return;
    }
    if (rect.x > puzzle.contWidth - dimx) {
      this.moveTo(this.x + puzzle.contWidth - dimx - rect.x, this.y);
      return;
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function fitImage(img, width, height) {
  let wn = img.naturalWidth;
  let hn = img.naturalHeight;
  let w = width;
  let h = (w * hn) / wn;
  if (h > height) {
    h = height;
    w = (h * wn) / hn;
  }
  img.style.position = "absolute";
  img.style.width = w + "px";
  img.style.height = h + "px";
  img.style.top = "50%";
  img.style.left = "50%";
  img.style.transform = "translate(-50%,-50%)";
}

// ============================================================================
// Internal Puzzle Class (refactored to be UI-independent)
// ============================================================================

class InternalPuzzle {
  constructor(container) {
    this.container = typeof container === "string" 
      ? document.getElementById(container)
      : container;

    this.gameCanvas = document.createElement("CANVAS");
    this.container.appendChild(this.gameCanvas);

    this.srcImage = new Image();
    this.imageLoaded = false;
    
    // State
    this.nbPieces = 20;
    this.rotationAllowed = false;
    this.typeOfShape = 0;
       this.fixedNx = 0;   // явное количество столбцов
    this.fixedNy = 0;   // явное количество строк
  }

  getContainerSize() {
    let styl = window.getComputedStyle(this.container);
    this.contWidth = parseFloat(styl.width);
    this.contHeight = parseFloat(styl.height);
  }

 create(baseData) {
    this.prng = mMash(baseData ? baseData[3] : null);
    this.container.innerHTML = "";
    this.getContainerSize();

    if (baseData) {
        this.nx = baseData[0];
        this.ny = baseData[1];
        this.rotationAllowed = !!baseData[4];
        this.typeOfShape = baseData[5];
    } else {
        // ★★★ Если заданы явные размеры – используем их ★★★
        if (this.fixedNx > 0 && this.fixedNy > 0) {
            this.nx = this.fixedNx;
            this.ny = this.fixedNy;
        } else {
            this.computenxAndny();
        }
    }

    this.relativeHeight =
      this.srcImage.naturalHeight /
      this.ny /
      (this.srcImage.naturalWidth / this.nx);

    if (!baseData) {
      this.typeOfShape = this.typeOfShape || 0;
    }

    this.defineShapes({
      coeffDecentr: 0.12,
      twistf: [twist0, twist1, twist2, twist3][this.typeOfShape]
    });

    this.polyPieces = [];
    if (!baseData) {
      this.pieces.forEach((row) =>
        row.forEach((piece) => {
          this.polyPieces.push(new PolyPiece(piece, this));
        })
      );
      arrayShuffle(this.polyPieces);
      if (this.rotationAllowed)
        this.polyPieces.forEach((pp) => (pp.rot = intAlea(4)));
    } else {
      const pps = baseData[8];
      const offs = this.rotationAllowed ? 3 : 2;
      pps.forEach((ppData) => {
        let polyp = new PolyPiece(this.pieces[ppData[offs + 1]][ppData[offs]], this);
        polyp.x = ppData[0];
        polyp.y = ppData[1];
        polyp.rot = this.rotationAllowed ? ppData[2] : 0;
        for (let k = offs + 2; k < ppData.length; k += 2) {
          let kx = ppData[k];
          let ky = ppData[k + 1];
          polyp.pieces.push(this.pieces[ky][kx]);
          polyp.pckxmin = mmin(polyp.pckxmin, kx);
          polyp.pckxmax = mmax(polyp.pckxmax, kx + 1);
          polyp.pckymin = mmin(polyp.pckymin, ky);
          polyp.pckymax = mmax(polyp.pckymax, ky + 1);
        }
        polyp.listLoops();
        this.polyPieces.push(polyp);
      });
    }
    this.evaluateZIndex();
  }

  computenxAndny() {
    let kx, ky,
      width = this.srcImage.naturalWidth,
      height = this.srcImage.naturalHeight,
      npieces = this.nbPieces;
    let err, errmin = 1e9;
    let ncv, nch;

    let nHPieces = mround(msqrt((npieces * width) / height));
    let nVPieces = mround(npieces / nHPieces);

    for (ky = 0; ky < 5; ky++) {
      ncv = nVPieces + ky - 2;
      for (kx = 0; kx < 5; kx++) {
        nch = nHPieces + kx - 2;
        err = (nch * height) / ncv / width;
        err = err + 1 / err - 2;
        err += mabs(1 - (nch * ncv) / npieces);

        if (err < errmin) {
          errmin = err;
          this.nx = nch;
          this.ny = ncv;
        }
      }
    }
  }

  defineShapes(shapeDesc) {
    let { coeffDecentr, twistf } = shapeDesc;
    const corners = [];
    const nx = this.nx, ny = this.ny;
    let np;

    for (let ky = 0; ky <= ny; ++ky) {
      corners[ky] = [];
      for (let kx = 0; kx <= nx; ++kx) {
        corners[ky][kx] = new Point(
          kx + this.prng.alea(-coeffDecentr, coeffDecentr),
          ky + this.prng.alea(-coeffDecentr, coeffDecentr)
        );
        if (kx == 0) corners[ky][kx].x = 0;
        if (kx == nx) corners[ky][kx].x = nx;
        if (ky == 0) corners[ky][kx].y = 0;
        if (ky == ny) corners[ky][kx].y = ny;
      }
    }

    this.pieces = [];
    for (let ky = 0; ky < ny; ++ky) {
      this.pieces[ky] = [];
      for (let kx = 0; kx < nx; ++kx) {
        this.pieces[ky][kx] = np = new Piece(kx, ky);
        if (ky == 0) {
          np.ts.points = [corners[ky][kx], corners[ky][kx + 1]];
          np.ts.type = "d";
        } else {
          np.ts = this.pieces[ky - 1][kx].bs.reversed();
        }
        np.rs.points = [corners[ky][kx + 1], corners[ky + 1][kx + 1]];
        np.rs.type = "d";
        if (kx < nx - 1) {
          if (this.prng.intAlea(2))
            twistf(np.rs, corners[ky][kx], corners[ky + 1][kx], this.prng);
          else twistf(np.rs, corners[ky][kx + 2], corners[ky + 1][kx + 2], this.prng);
        }
        if (kx == 0) {
          np.ls.points = [corners[ky + 1][kx], corners[ky][kx]];
          np.ls.type = "d";
        } else {
          np.ls = this.pieces[ky][kx - 1].rs.reversed();
        }
        np.bs.points = [corners[ky + 1][kx + 1], corners[ky + 1][kx]];
        np.bs.type = "d";
        if (ky < ny - 1) {
          if (this.prng.intAlea(2))
            twistf(np.bs, corners[ky][kx + 1], corners[ky][kx], this.prng);
          else twistf(np.bs, corners[ky + 2][kx + 1], corners[ky + 2][kx], this.prng);
        }
      }
    }
  }

scale() {
    if (this.contWidth <= 0 || this.contHeight <= 0) {
        console.warn('[InternalPuzzle] scale: container has zero size, ignoring');
        return;
    }
    const maxWidth = 0.98 * this.contWidth;
    const maxHeight = 0.98 * this.contHeight;
    const woh = this.srcImage.naturalWidth / this.srcImage.naturalHeight;

    // Вычисляем масштаб так, чтобы пазл помещался целиком
    let scaleX = maxWidth / this.nx;
    let scaleY = maxHeight / this.ny;
    let scale = Math.min(scaleX, scaleY);

    let gameWidth = this.nx * scale;
    let gameHeight = this.ny * scale;

    // Проверяем, не превышает ли пазл контейнер (из-за округлений)
    if (gameWidth > maxWidth) {
        gameWidth = maxWidth;
        scale = gameWidth / this.nx;
        gameHeight = this.ny * scale;
    }
    if (gameHeight > maxHeight) {
        gameHeight = maxHeight;
        scale = gameHeight / this.ny;
        gameWidth = this.nx * scale;
    }

    this.doScale(gameWidth);
}

  doScale(width) {
    this.gameWidth = width;
    this.gameHeight = (width * this.srcImage.naturalHeight) / this.srcImage.naturalWidth;

    this.gameCanvas.width = this.gameWidth;
    this.gameCanvas.height = this.gameHeight;
    this.gameCtx = this.gameCanvas.getContext("2d");
    this.gameCtx.drawImage(this.srcImage, 0, 0, this.gameWidth, this.gameHeight);

    this.gameCanvas.classList.add("gameCanvas");
    this.gameCanvas.style.zIndex = 500;

    this.scalex = this.gameWidth / this.nx;
    this.scaley = this.gameHeight / this.ny;

    this.pieces.forEach((row) => {
      row.forEach((piece) => piece.scale(this));
    });

    this.offsx = (this.contWidth - this.gameWidth) / 2;
    this.offsy = (this.contHeight - this.gameHeight) / 2;
   // this.dConnect = mmax(10, mmin(this.scalex, this.scaley) / 10);
this.dConnect = mmax(15, mmin(this.scalex, this.scaley) / 8);

    this.embossThickness = mmin(2 + (this.scalex / 200) * (5 - 2), 5);
  }

  sweepBy(dx, dy) {
    this.polyPieces.forEach((pp) => {
      pp.moveTo(pp.x + dx, pp.y + dy);
    });
  }

  zoomBy(coef, center) {
    let futWidth = this.gameWidth * coef;
    let futHeight = this.gameHeight * coef;
    if (
      ((futWidth > 3000 || futHeight > 3000) && coef > 1) ||
      (futWidth < 200 || futHeight < 200) & (coef < 1)
    )
      return;
    if (coef == 1) return;

    this.doScale(futWidth);
    this.polyPieces.forEach((pp) => {
      pp.moveTo(
        coef * (pp.x - center.x) + center.x,
        coef * (pp.y - center.y) + center.y
      );
      pp.drawImage();
    });
  }

  relativeMouseCoordinates(event) {
    const br = this.container.getBoundingClientRect();
    return {
      x: event.clientX - br.x,
      y: event.clientY - br.y
    };
  }

  limitRectangle(rect) {
    let minscale = mmin(this.scalex, this.scaley);
    rect.x0 = mmin(mmax(rect.x0, -minscale / 2), this.contWidth - 1.5 * minscale);
    rect.x1 = mmin(mmax(rect.x1, -minscale / 2), this.contWidth - 1.5 * minscale);
    rect.y0 = mmin(mmax(rect.y0, -minscale / 2), this.contHeight - 1.5 * minscale);
    rect.y1 = mmin(mmax(rect.y1, -minscale / 2), this.contHeight - 1.5 * minscale);
  }

  spreadInRectangle(rect) {
    this.limitRectangle(rect);
    this.polyPieces.forEach((pp) =>
      pp.moveTo(alea(rect.x0, rect.x1), alea(rect.y0, rect.y1))
    );
  }

  spreadSetInRectangle(set, rect) {
    this.limitRectangle(rect);
    set.forEach((pp) =>
      pp.moveTo(alea(rect.x0, rect.x1), alea(rect.y0, rect.y1))
    );
  }

  optimInitial() {
    const minx = -this.scalex / 2;
    const miny = -this.scaley / 2;
    const maxx = this.contWidth - 1.5 * this.scalex;
    const maxy = this.contHeight - 1.5 * this.scaley;
    let freex = this.contWidth - this.gameWidth;
    let freey = this.contHeight - this.gameHeight;

    let where = [0, 0, 0, 0];
    let rects = [];
    if (freex > 1.5 * this.scalex) {
      where[1] = 1;
      rects[1] = {
        x0: this.gameWidth - 0.5 * this.scalex,
        x1: maxx,
        y0: miny,
        y1: maxy
      };
    }
    if (freex > 3 * this.scalex) {
      where[3] = 1;
      rects[3] = {
        x0: minx,
        x1: freex / 2 - 1.5 * this.scalex,
        y0: miny,
        y1: maxy
      };
      rects[1].x0 = this.contWidth - freex / 2 - 0.5 * this.scalex;
    }
    if (freey > 1.5 * this.scaley) {
      where[2] = 1;
      rects[2] = {
        x0: minx,
        x1: maxx,
        y0: this.gameHeight - 0.5 * this.scaley,
        y1: this.contHeight - 1.5 * this.scaley
      };
    }
    if (freey > 3 * this.scaley) {
      where[0] = 1;
      rects[0] = {
        x0: minx,
        x1: maxx,
        y0: miny,
        y1: freey / 2 - 1.5 * this.scaley
      };
      rects[2].y0 = this.contHeight - freey / 2 - 0.5 * this.scaley;
    }
    if (where.reduce((sum, a) => sum + a) < 2) {
      if (freex - freey > 0.2 * this.scalex || where[1]) {
        this.spreadInRectangle({
          x0: this.gameWidth - this.scalex / 2,
          x1: maxx,
          y0: miny,
          y1: maxy
        });
      } else if (freey - freex > 0.2 * this.scalex || where[2]) {
        this.spreadInRectangle({
          x0: minx,
          x1: maxx,
          y0: this.gameHeight - this.scaley / 2,
          y1: maxy
        });
      } else {
        if (this.gameWidth > this.gameHeight) {
          this.spreadInRectangle({
            x0: minx,
            x1: maxx,
            y0: this.gameHeight - this.scaley / 2,
            y1: maxy
          });
        } else {
          this.spreadInRectangle({
            x0: this.gameWidth - this.scalex / 2,
            x1: maxx,
            y0: miny,
            y1: maxy
          });
        }
      }
      return;
    }
    let nrects = [];
    rects.forEach((rect) => nrects.push(rect));
    let k0 = 0;
    const npTot = this.nx * this.ny;
    for (let k = 0; k < nrects.length; ++k) {
      let k1 = mround(((k + 1) / nrects.length) * npTot);
      this.spreadSetInRectangle(this.polyPieces.slice(k0, k1), nrects[k]);
      k0 = k1;
    }
    arrayShuffle(this.polyPieces);
    this.evaluateZIndex();
  }

  evaluateZIndex() {
    for (let k = this.polyPieces.length - 1; k > 0; --k) {
      if (
        this.polyPieces[k].pieces.length > this.polyPieces[k - 1].pieces.length
      ) {
        [this.polyPieces[k], this.polyPieces[k - 1]] = [
          this.polyPieces[k - 1],
          this.polyPieces[k]
        ];
      }
    }
    this.polyPieces.forEach((pp, k) => {
      pp.canvas.style.zIndex = k + 10;
    });
    this.zIndexSup = this.polyPieces.length + 10;
  }

  getStateData() {
    let ppData;
    let saved = { signature: FILE_SIGNATURE };
    if ("origin" in this.srcImage.dataset) {
      saved.origin = this.srcImage.dataset.origin;
    }
    saved.src = this.srcImage.src;
    let base = [
      this.nx,
      this.ny,
      this.scalex * this.nx,
      this.prng.seed,
      this.rotationAllowed ? 1 : 0,
      this.typeOfShape,
      this.srcImage.naturalWidth,
      this.srcImage.naturalHeight
    ];
    saved.base = base;
    let pps = [];
    base.push(pps);
    this.polyPieces.forEach((pp) => {
     // ppData = [mround(pp.x), mround(pp.y)];
      ppData = [pp.x, pp.y];

      if (this.rotationAllowed) ppData.push(pp.rot);
      pp.pieces.forEach((p) => ppData.push(p.kx, p.ky));
      pps.push(ppData);
    });
    return saved;
  }

  restoreFromData(savedData) {
    if (!savedData || !savedData.base || !savedData.base[8]) {
        console.warn('[InternalPuzzle] Нет данных для восстановления');
        return;
    }
    const base = savedData.base;
    const ppData = base[8];
    if (!ppData || ppData.length === 0) return;

    // Сохраняем ссылку на контейнер
    const container = this.container;

    // Удаляем старые поликуски
    this.polyPieces.forEach(pp => {
        if (pp.canvas && pp.canvas.parentNode) {
            pp.canvas.remove();
        }
    });
    this.polyPieces = [];

    const rotationAllowed = this.rotationAllowed;
    const offs = rotationAllowed ? 3 : 2;

    for (const ppItem of ppData) {
        // Координаты и поворот
        const x = ppItem[0];
        const y = ppItem[1];
        const rot = rotationAllowed ? ppItem[2] : 0;

        // Собираем индексы кусков
        const piecesIndices = [];
        for (let k = offs; k < ppItem.length; k += 2) {
            const kx = ppItem[k];
            const ky = ppItem[k + 1];
            if (this.pieces[ky] && this.pieces[ky][kx]) {
                piecesIndices.push({ kx, ky });
            } else {
                console.warn('[InternalPuzzle] Кусок не найден:', kx, ky);
            }
        }

        if (piecesIndices.length === 0) continue;

        // Создаём новый поликусок на основе первого куска
        const firstPiece = this.pieces[piecesIndices[0].ky][piecesIndices[0].kx];
        const pp = new PolyPiece(firstPiece, this);
        // Добавляем остальные куски
        for (let i = 1; i < piecesIndices.length; i++) {
            const p = this.pieces[piecesIndices[i].ky][piecesIndices[i].kx];
            pp.pieces.push(p);
            // Обновляем границы
            pp.pckxmin = Math.min(pp.pckxmin, p.kx);
            pp.pckxmax = Math.max(pp.pckxmax, p.kx + 1);
            pp.pckymin = Math.min(pp.pckymin, p.ky);
            pp.pckymax = Math.max(pp.pckymax, p.ky + 1);
        }
        pp.listLoops();
        pp.moveTo(x, y);
        pp.rot = rot;
        pp.drawImage();
        this.polyPieces.push(pp);
    }
    this.evaluateZIndex();
    console.log('[InternalPuzzle] Восстановлено поликусков:', this.polyPieces.length);

}



}

// ============================================================================
// JigsawPuzzle - Main Public API Class
// ============================================================================

class JigsawPuzzle {
  constructor(containerId, options = {}) {
    const container = typeof containerId === "string"
      ? document.getElementById(containerId)
      : containerId;

    if (!container) {
      throw new Error("Container element not found");
    }

    this.options = {
      image: options.image || null,
      numPieces: options.numPieces || 20,
      shapeType: options.shapeType || 0,
      allowRotation: options.allowRotation || false,
      onReady: options.onReady || null,
      onWin: options.onWin || null,
      onStart: options.onStart || null,
      onStop: options.onStop || null,
      attempts: options.attempts !== undefined ? options.attempts : Infinity,
      onAttempt: options.onAttempt || null,
      onNoAttempts: options.onNoAttempts || null,
      rows: options.rows || 0,
      cols: options.cols || 0,
    };

    // ★ Новая опция для пропуска начальных состояний
this.options.initialState = options.initialState || 0;

    this.attempts = this.options.attempts;
    this.onAttempt = this.options.onAttempt;
    this.attemptsUsed = 0;

    this.puzzle = new InternalPuzzle(container);
    this.puzzle.nbPieces = this.options.numPieces;
    this.puzzle.rotationAllowed = this.options.allowRotation;
    this.puzzle.typeOfShape = this.options.shapeType;

    this.events = [];
    this.state = 0;
    this.moving = {};
    this.tmpImage = null;
    this.lastMousePos = { x: 0, y: 0 };
    this.useMouse = true;
    this.playing = false;
    this.animationFrameId = null;
    this.restoredState = null;
    this.restoredString = "";
    // ★ Добавляем флаг для блокировки автоматической победы при загрузке
    this._skipWinOnLoad = false;
this._blockWin = false; // ★ блокирует автоматический переход в state 60

    if (this.options.rows > 0 && this.options.cols > 0) {
      this.puzzle.fixedNx = this.options.cols;
      this.puzzle.fixedNy = this.options.rows;
      this.puzzle.nbPieces = this.options.rows * this.options.cols;
    }

    this._setupEventHandlers();
    this.puzzle.srcImage.addEventListener("load", () => this._imageLoaded());

    window.addEventListener("resize", () => {
      if (this.events.length && this.events[this.events.length - 1].event === "resize") return;
      this.events.push({ event: "resize" });
    });

    if (this.options.image) {
      this.setImage(this.options.image);
    }

    this._animate(0);
  }

  _setupEventHandlers() {
    const puzzle = this.puzzle;
    const container = puzzle.container;

    container.addEventListener("mousedown", (event) => {
      if (this.attempts <= 0) return;
      this.useMouse = true;
      event.preventDefault();
      if (event.button !== 0) return;
      this.events.push({
        event: "touch",
        position: puzzle.relativeMouseCoordinates(event)
      });
    });

    container.addEventListener("touchstart", (event) => {
      if (this.attempts <= 0) return;
      this.useMouse = false;
      event.preventDefault();
      if (event.touches.length === 0) return;
      const rTouch = [];
      for (let k = 0; k < event.touches.length; ++k) {
        rTouch[k] = puzzle.relativeMouseCoordinates(event.touches.item(k));
      }
      if (event.touches.length === 1) {
        this.events.push({ event: "touch", position: rTouch[0] });
      }
      if (event.touches.length === 2) {
        this.events.push({ event: "touches", touches: rTouch });
      }
    }, { passive: false });

    const handleLeave = () => {
      this.events.push({ event: "leave" });
    };

    container.addEventListener("mouseup", (event) => {
      this.useMouse = true;
      event.preventDefault();
      if (event.button !== 0) return;
      handleLeave();
    });
    container.addEventListener("touchend", handleLeave);
    container.addEventListener("touchleave", handleLeave);
    container.addEventListener("touchcancel", handleLeave);

    container.addEventListener("mousemove", (event) => {
      this.useMouse = true;
      event.preventDefault();
      if (this.events.length && this.events[this.events.length - 1].event === "move")
        this.events.pop();
      const pos = puzzle.relativeMouseCoordinates(event);
      this.lastMousePos = pos;
      this.events.push({
        event: "move",
        position: pos,
        ev: event
      });
    });

    container.addEventListener("touchmove", (event) => {
      this.useMouse = false;
      event.preventDefault();
      const rTouch = [];
      if (event.touches.length === 0) return;
      for (let k = 0; k < event.touches.length; ++k) {
        rTouch[k] = puzzle.relativeMouseCoordinates(event.touches.item(k));
      }
      if (event.touches.length === 1) {
        if (this.events.length && this.events[this.events.length - 1].event === "move")
          this.events.pop();
        this.events.push({ event: "move", position: rTouch[0] });
      }
      if (event.touches.length === 2) {
        if (this.events.length && this.events[this.events.length - 1].event === "moves")
          this.events.pop();
        this.events.push({ event: "moves", touches: rTouch });
      }
    }, { passive: false });

    container.addEventListener("wheel", (event) => {
      this.useMouse = true;
      event.preventDefault();
      if (this.events.length && this.events[this.events.length - 1].event === "wheel")
        this.events.pop();
      this.events.push({ event: "wheel", wheel: event });
    });
  }

  _imageLoaded() {
    this.puzzle.imageLoaded = true;
    let event = { event: "srcImageLoaded" };
    if (this.restoredState) {
      if (
        mround(this.puzzle.srcImage.naturalWidth) !== this.restoredState.base[6] ||
        mround(this.puzzle.srcImage.naturalHeight) !== this.restoredState.base[7]
      ) {
        event.event = "wrongImage";
        this.restoredState = null;
      }
    }
    this.events.push(event);
  }

  _animate(tStamp) {
    this.animationFrameId = requestAnimationFrame((ts) => this._animate(ts));

    let event;
    if (this.events.length) event = this.events.shift();
    if (event && event.event === "reset") this.state = 0;

if (event && event.event === "resize") {
    const puzzle = this.puzzle;
    const prevWidth = puzzle.contWidth;
    const prevHeight = puzzle.contHeight;
    puzzle.getContainerSize();
       // ★ НОВАЯ ПРОВЕРКА: если размер нулевой – ничего не делаем
    if (puzzle.contWidth === 0 || puzzle.contHeight === 0) {
        // восстанавливаем старые размеры
        puzzle.contWidth = prevWidth;
        puzzle.contHeight = prevHeight;
        return;
    }

    // ★ Если размеры не изменились – игнорируем событие
    if (puzzle.contWidth === prevWidth && puzzle.contHeight === prevHeight) {
        return;
    }

    if (this.state === 15 || this.state === 60) {
        fitImage(this.tmpImage, puzzle.contWidth * 0.95, puzzle.contHeight * 0.95);
    } else if (this.state >= 25) {
        const reScale = puzzle.contWidth / prevWidth;
        puzzle.scale();
        puzzle.polyPieces.forEach((pp) => {
            let nx = puzzle.contWidth / 2 - (prevWidth / 2 - pp.x) * reScale;
            let ny = puzzle.contHeight / 2 - (prevHeight / 2 - pp.y) * reScale;
            nx = mmin(mmax(nx, -puzzle.scalex / 2), puzzle.contWidth - 1.5 * puzzle.scalex);
            ny = mmin(mmax(ny, -puzzle.scaley / 2), puzzle.contHeight - 1.5 * puzzle.scaley);
            pp.moveTo(nx, ny);
            pp.drawImage();
        });
    }
    return;
}

    switch (this.state) {
      case 0:
        this.state = 10;

        case 10:
    this.playing = false;
    if (!this.puzzle.imageLoaded) return;
    this.puzzle.container.innerHTML = "";
    this.tmpImage = document.createElement("img");
    this.tmpImage.src = this.puzzle.srcImage.src;
    this.puzzle.getContainerSize();
    fitImage(this.tmpImage, this.puzzle.contWidth * 0.95, this.puzzle.contHeight * 0.95);
   this.tmpImage.style.boxShadow = "0 4px 12px rgba(42, 31, 20, 0.25)";
    this.puzzle.container.appendChild(this.tmpImage);
    // ★ Если нужно сразу показать готовую картинку – переходим в состояние 15 (финальное)
    if (this.options.initialState === 60) {
        this.state = 15;
        break;
    }
    this.state = 15;
    if (this.options.onReady) this.options.onReady();
    break;

      case 15:
        this.playing = false;
        if (!event) return;
        if (event.event === "nbpieces") {
          this.puzzle.nbPieces = event.nbpieces;
          this.state = 20;
        } else if (event.event === "srcImageLoaded") {
          this.state = 10;
          return;
        } else if (event.event === "restore") {
          this.state = 150;
          return;
        }
        break;

      case 20:
        this.playing = true;
        if (this.options.onStart) this.options.onStart();
        this.puzzle.rotationAllowed = this.options.allowRotation;
        if (this.restoredState) {
          this.puzzle.create(this.restoredState.base);
        } else {
          this.puzzle.create();
        }
        if (this.restoredState) {
          this.puzzle.doScale(this.restoredState.base[2]);
        } else {
          this.puzzle.scale();
        }
        this.puzzle.polyPieces.forEach((pp) => {
          pp.drawImage();
          if (this.restoredState) {
            pp.moveTo(pp.x, pp.y);
          } else {
            pp.moveToInitialPlace();
          }
        });
        this.puzzle.gameCanvas.style.top = this.puzzle.offsy + "px";
        this.puzzle.gameCanvas.style.left = this.puzzle.offsx + "px";
        this.puzzle.gameCanvas.style.display = "none";
        this.state = 25;
        if (this.restoredState) {
          this.restoredState = null;
          this.state = 50;
        }
        break;

      case 25:
        this.puzzle.gameCanvas.style.display = "none";
        this.puzzle.polyPieces.forEach((pp) => pp.canvas.classList.add("moving"));
        this.state = 30;
        break;

      case 30:
        this.puzzle.optimInitial();
        setTimeout(() => this.events.push({ event: "finished" }), 1200);
        this.state = 35;
        break;

      case 35:
        if (!event || event.event !== "finished") return;
        this.puzzle.polyPieces.forEach((pp) => pp.canvas.classList.remove("moving"));
        this.state = 50;
        break;

      case 50:
        if (!event) return;
        if (event.event === "stop") {
          this.state = 10;
          return;
        }
        if (event.event === "nbpieces") {
          this.puzzle.nbPieces = event.nbpieces;
          this.state = 20;
        } else if (event.event === "save") {
          this.state = 120;
        } else if (event.event === "touch") {
          // ★ Сбрасываем флаг при первом касании пользователя, чтобы разрешить победу в будущем
          this._skipWinOnLoad = false;

       if (this.attempts <= 0) {
    if (this.options.onNoAttempts) {
        this.options.onNoAttempts();
    }
    this.state = 50;
    break;
}
          this.attempts--;
          this.attemptsUsed++;
          if (this.onAttempt) {
            this.onAttempt(this.attemptsUsed, this.attempts);
          }

          this.moving = {
            xMouseInit: event.position.x,
            yMouseInit: event.position.y,
            tInit: tStamp
          };
          for (let k = this.puzzle.polyPieces.length - 1; k >= 0; --k) {
            let pp = this.puzzle.polyPieces[k];
            if (pp.isPointInPath(event.position)) {
              pp.selected = true;
              pp.drawImage();
              this.moving.pp = pp;
              this.moving.ppXInit = pp.x;
              this.moving.ppYInit = pp.y;
              this.puzzle.polyPieces.splice(k, 1);
              this.puzzle.polyPieces.push(pp);
              pp.canvas.style.zIndex = this.puzzle.zIndexSup;
              this.state = 55;
              return;
            }
          }
          this.state = 100;
        } else if (event.event === "touches") {
          this.moving = { touches: event.touches };
          this.state = 110;
        } else if (event.event === "wheel") {
          if (event.wheel.deltaY > 0) this.puzzle.zoomBy(1.3, this.lastMousePos);
          if (event.wheel.deltaY < 0) this.puzzle.zoomBy(1 / 1.3, this.lastMousePos);
        }
        break;

     case 55:
    if (!event) return;
    if (event.event === "stop") {
        this.state = 10;
        return;
    }
    switch (event.event) {
        case "moves":
        case "touches":
            this.moving.pp.selected = false;
            this.moving.pp.drawImage();
            this.moving = { touches: event.touches };
            this.state = 110;
            break;
        case "move":
            if (event?.ev?.buttons === 0) {
                this.events.push({ event: "leave" });
                break;
            }
            this.moving.pp.moveTo(
                event.position.x - this.moving.xMouseInit + this.moving.ppXInit,
                event.position.y - this.moving.yMouseInit + this.moving.ppYInit
            );
            break;
        case "leave":
            if (this.puzzle.rotationAllowed && tStamp < this.moving.tInit + 250) {
                this.moving.pp.rotate((this.moving.pp.rot + 1) % 4);
                this.moving.pp.coerceToContainer();
            }
            this.moving.pp.selected = false;
            this.moving.pp.drawImage();
            let merged = false;
            let doneSomething;
            do {
                doneSomething = false;
                for (let k = this.puzzle.polyPieces.length - 1; k >= 0; --k) {
                    let pp = this.puzzle.polyPieces[k];
                    if (pp === this.moving.pp) continue;
                    if (this.moving.pp.ifNear(pp)) {
                        merged = true;
                        if (pp.pieces.length > this.moving.pp.pieces.length) {
                            pp.merge(this.moving.pp);
                            this.moving.pp = pp;
                        } else {
                            this.moving.pp.merge(pp);
                        }
                        doneSomething = true;
                        break;
                    }
                }
            } while (doneSomething);
            this.puzzle.evaluateZIndex();
            if (merged) {
                this.moving.pp.selected = true;
                this.moving.pp.drawImage(true);
                this.moving.tInit = tStamp + 500;
                this.state = 56;
                break;
            }
            // ★ Если не объединились – переходим в состояние ожидания (50)
            this.state = 50;

            // ★★★ НОВАЯ ПРОВЕРКА ПОБЕДЫ (с учётом _blockWin) ★★★
            // Если на доске остался один поликусок, его поворот 0, и мы НЕ в режиме пропуска победы при загрузке
            if (this.puzzle.polyPieces.length === 1 && this.puzzle.polyPieces[0].rot === 0 && !this._skipWinOnLoad) {
                // Вызываем колбэк победы (если он задан)
                if (this.options.onWin) {
                    this.options.onWin();
                }
                // Если _blockWin == false – переходим в финальное состояние 60 (готовая картинка)
                // Если _blockWin == true – остаёмся в состоянии 50 (ждём, пока анимация звёзд не вызовет forceWin)
                if (!this._blockWin) {
                    this.state = 60;
                }
                // если _blockWin true – ничего не делаем, остаёмся в 50
            }
    }
    break;

case 56:
    if (tStamp < this.moving.tInit) return;
    this.moving.pp.selected = false;
    this.moving.pp.drawImage();
    // ★ Проверяем победу
    if (this.puzzle.polyPieces.length === 1 && this.puzzle.polyPieces[0].rot === 0 && !this._skipWinOnLoad) {
        if (this.options.onWin) {
            this.options.onWin();
        }
        if (!this._blockWin) {
            this.state = 60;
        } else {
            this.state = 50;   // ← явный переход, если _blockWin = true
        }
    } else {
        this.state = 50;
    }
    break;

case 60:
    this.playing = false;
    // ★ Удаляем повторный вызов onWin, он уже был вызван ранее
    // if (this.options.onWin) this.options.onWin();

    this.puzzle.container.innerHTML = "";
    this.puzzle.getContainerSize();
    fitImage(this.tmpImage, this.puzzle.contWidth * 0.95, this.puzzle.contHeight * 0.95);

    // ★ Проверяем, есть ли куски, чтобы позиционировать картинку правильно
    if (this.puzzle.polyPieces && this.puzzle.polyPieces.length > 0) {
        const finalWidth = this.tmpImage.style.width;
        const finalHeight = this.tmpImage.style.height;
        // Позиционируем относительно первого поликуска (как было ранее)
        this.tmpImage.style.width = `${this.puzzle.nx * this.puzzle.scalex}px`;
        this.tmpImage.style.height = `${this.puzzle.ny * this.puzzle.scaley}px`;
        this.tmpImage.style.left = `${((this.puzzle.polyPieces[0].x + this.puzzle.scalex / 2 + this.puzzle.gameWidth / 2) / this.puzzle.contWidth) * 100}%`;
        this.tmpImage.style.top = `${((this.puzzle.polyPieces[0].y + this.puzzle.scaley / 2 + this.puzzle.gameHeight / 2) / this.puzzle.contHeight) * 100}%`;
        this.tmpImage.style.boxShadow = "0 4px 12px rgba(42, 31, 20, 0.25)";
        this.tmpImage.classList.add("moving");
        setTimeout(() => {
            this.tmpImage.style.top = this.tmpImage.style.left = "50%";
            this.tmpImage.style.width = finalWidth;
            this.tmpImage.style.height = finalHeight;
        }, 0);
    } else {
        // ★ Если кусков нет (initialState: 60) – просто центрируем картинку
        this.tmpImage.style.position = "absolute";
        this.tmpImage.style.top = "50%";
        this.tmpImage.style.left = "50%";
        this.tmpImage.style.transform = "translate(-50%, -50%)";
        this.tmpImage.style.width = Math.min(this.puzzle.contWidth * 0.95, this.tmpImage.naturalWidth) + "px";
        this.tmpImage.style.height = "auto";
        this.tmpImage.style.boxShadow = "0 4px 12px rgba(42, 31, 20, 0.25)";
    }

    this.puzzle.container.appendChild(this.tmpImage);
    this.state = 15;
    break;


      case 100:
        if (!event) return;
        if (event.event === "move") {
          if (event?.ev?.buttons === 0) {
            this.state = 50;
            break;
          }
          this.puzzle.sweepBy(
            event.position.x - this.moving.xMouseInit,
            event.position.y - this.moving.yMouseInit
          );
          this.moving.xMouseInit = event.position.x;
          this.moving.yMouseInit = event.position.y;
          return;
        }
        if (event.event === "leave") {
          this.state = 50;
          return;
        }
        if (event.event === "touches") {
          this.moving = { touches: event.touches };
          this.state = 110;
        }
        break;

      case 110:
        if (!event) return;
        if (event.event === "leave") {
          this.state = 50;
          return;
        }
        if (event.event === "moves") {
          const center = {
            x: (this.moving.touches[0].x + this.moving.touches[1].x) / 2,
            y: (this.moving.touches[0].y + this.moving.touches[1].y) / 2
          };
          const dInit = mhypot(
            this.moving.touches[0].x - this.moving.touches[1].x,
            this.moving.touches[0].y - this.moving.touches[1].y
          );
          const d = mhypot(
            event.touches[0].x - event.touches[1].x,
            event.touches[0].y - event.touches[1].y
          );
          const dRef = msqrt(this.puzzle.contWidth * this.puzzle.contHeight) / 5;
          this.puzzle.zoomBy(Math.exp((d - dInit) / dRef), center);
          this.moving.touches = event.touches;
          return;
        }
        break;

      case 120:
        const savedData = this.puzzle.getStateData();
        const savedString = JSON.stringify(savedData);
        if (event && event.callback) {
          event.callback(savedString);
        }
        this.state = 50;
        break;

      case 150:
        this.restoredString = "";
        if (event && event.data) {
          this.restoredString = event.data;
          this.state = 155;
        } else {
          try {
            this.restoredString = localStorage.getItem("savepuzzle");
            if (!this.restoredString) this.restoredString = "";
          } catch (exception) {
            this.restoredString = "";
          }
          if (this.restoredString.length === 0) {
            this.state = 15;
            break;
          }
          this.state = 155;
        }
        break;

      case 155:
        try {
          this.restoredState = JSON.parse(this.restoredString);
        } catch (error) {
          this.restoredState = null;
          this.state = 10;
          break;
        }
        if (
          !this.restoredState.signature ||
          this.restoredState.signature !== FILE_SIGNATURE ||
          !this.restoredState.src
        ) {
          this.restoredState = null;
          this.state = 10;
          break;
        }
        this.puzzle.imageLoaded = false;
        this.puzzle.srcImage.src = this.restoredState.src;
        if (this.restoredState.origin)
          this.puzzle.srcImage.dataset.origin = this.restoredState.origin;
        else
          delete this.puzzle.srcImage.dataset.origin;
        this.state = 158;
        // fall through

      case 158:
        if (event && event.event === "srcImageLoaded") {
          this.state = 160;
        } else if (event && event.event === "wrongImage") {
          this.state = 10;
        }
        break;

      case 160:
        this.tmpImage.src = this.puzzle.srcImage.src;
        fitImage(this.tmpImage, this.puzzle.contWidth * 0.95, this.puzzle.contHeight * 0.95);
        this.state = 20;
        // ★ Убираем сброс флага здесь, он сбрасывается только при касании пользователя
        break;
    }
  }

forceWin() {
    if (this.state === 60) return; // уже в финальном состоянии – ничего не делаем
    this._blockWin = false;
    this.state = 60;
}

  // ---------- Public API ----------
  start() {
    this.events.push({ event: "nbpieces", nbpieces: this.options.numPieces });
  }

  stop() {
    this.playing = false;
    if (this.options.onStop) this.options.onStop();
    this.events.push({ event: "stop" });
  }

reset() {
    this._skipWinOnLoad = false;
    this._blockWin = false;
    this.events.push({ event: "reset" });
    this.state = 0;
    this.playing = false;
    this.restoredState = null;
    this.restoredString = "";
}

  save(callback) {
    if (callback) {
      this.events.push({ event: "save", callback });
    } else {
      this.events.push({ event: "save", callback: (data) => {
        try {
          localStorage.setItem("savepuzzle", data);
        } catch (exception) {
          console.error("Failed to save to localStorage:", exception);
        }
      }});
    }
  }

load(savedData) {
    this._skipWinOnLoad = true;
    this._blockWin = false;
    this.events.push({ event: "restore", data: savedData });
}

  restore(savedData) {
    if (this.puzzle && this.puzzle.restoreFromData) {
        this.puzzle.restoreFromData(savedData);
        // Переходим в игровое состояние
        this.state = 50;
        // Перерисовываем куски (уже сделано, но на всякий случай)
        this.puzzle.polyPieces.forEach(pp => pp.drawImage());
    }
}

  setImage(imageUrl) {
    this.options.image = imageUrl;
    this.puzzle.imageLoaded = false;
    this.puzzle.srcImage.src = imageUrl;
    delete this.puzzle.srcImage.dataset.origin;
  }

  setOptions(newOptions) {
    Object.assign(this.options, newOptions);
    if (newOptions.numPieces !== undefined) this.puzzle.nbPieces = newOptions.numPieces;
    if (newOptions.allowRotation !== undefined) this.puzzle.rotationAllowed = newOptions.allowRotation;
    if (newOptions.shapeType !== undefined) this.puzzle.typeOfShape = newOptions.shapeType;
    if (newOptions.attempts !== undefined) {
      this.attempts = newOptions.attempts;
      this.options.attempts = newOptions.attempts;
    }
    if (newOptions.onAttempt !== undefined) {
      this.onAttempt = newOptions.onAttempt;
      this.options.onAttempt = newOptions.onAttempt;
    }
  }

 destroy() {
    if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
    }
    this.events = [];
    this.playing = false;
    if (this.puzzle) {
        if (this.puzzle.container) {
            this.puzzle.container.innerHTML = "";
        }
        // ★ Очищаем ссылки на куски, чтобы они не пытались рисоваться
        this.puzzle.polyPieces = [];
        this.puzzle.pieces = [];
    }
}


}

// ============================================================================
// JigsawPuzzle - Main Public API Class
// ============================================================================

if (typeof window !== 'undefined') {
    window.JigsawPuzzle = JigsawPuzzle;
}