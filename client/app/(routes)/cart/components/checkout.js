(function e(t, r, n) {
  function i(s, o) {
    if (!r[s]) {
      if (!t[s]) {
        var c = "function" == typeof require && require;
        if (!o && c) return c(s, !0);
        if (a) return a(s, !0);
        var u = Error("Cannot find module '" + s + "'");
        throw ((u.code = "MODULE_NOT_FOUND"), u);
      }
      var l = (r[s] = { exports: {} });
      t[s][0].call(
        l.exports,
        function (e) {
          return i(t[s][1][e] || e);
        },
        l,
        l.exports,
        e,
        t,
        r,
        n
      );
    }
    return r[s].exports;
  }
  for (
    var a = "function" == typeof require && require, s = 0;
    s < n.length;
    s++
  )
    i(n[s]);
  return i;
})(
  {
    1: [
      function (e, t, r) {
        "use strict";
        t.exports = {
          AES_STANDARD: "AES-CBC",
          DEFAULT_MESSAGE_DIGEST: "sha256",
        };
      },
      {},
    ],
    2: [
      function (e, t, r) {
        "use strict";
        function n(e, t) {
          for (var r = 0; r < t.length; r++) {
            var n = t[r];
            (n.enumerable = n.enumerable || !1),
              (n.configurable = !0),
              "value" in n && (n.writable = !0),
              Object.defineProperty(e, n.key, n);
          }
        }
        var i = e("./helpers"),
          a = e("node-forge"),
          s = a.pki,
          o = (a.rsa, e("./constants")),
          c = o.DEFAULT_MESSAGE_DIGEST,
          u = o.AES_STANDARD,
          l = (function () {
            var e, t, r;
            function o() {
              var e =
                arguments.length > 0 && void 0 !== arguments[0]
                  ? arguments[0]
                  : {};
              (function (e, t) {
                if (!(e instanceof t))
                  throw TypeError("Cannot call a class as a function");
              })(this, o),
                (this.options = Object.assign(
                  {},
                  { md: c, entropy: void 0 },
                  e
                )),
                this.options.entropy && this._entropy(this.options.entropy);
            }
            return (
              (e = o),
              (t = [
                {
                  key: "_getMessageDigest",
                  value: function (e) {
                    switch (e) {
                      case "sha1":
                        return a.md.sha1.create();
                      case "sha256":
                        return a.md.sha256.create();
                      case "sha384":
                        return a.md.sha384.create();
                      case "sha512":
                        return a.md.sha512.create();
                      case "md5":
                        return a.md.md5.create();
                      default:
                        return (
                          console.warn(
                            'Message digest "'.concat(
                              this.options.md,
                              '" not found. Using default message digest "sha1" instead'
                            )
                          ),
                          a.md.sha1.create()
                        );
                    }
                  },
                },
                {
                  key: "_parseSignature",
                  value: function (e) {
                    try {
                      return JSON.parse(e);
                    } catch (t) {
                      return { signature: e, md: "sha1", v: i.version() };
                    }
                  },
                },
                {
                  key: "fingerprint",
                  value: function (e) {
                    return s.getPublicKeyFingerprint(e, {
                      encoding: "hex",
                      delimiter: ":",
                    });
                  },
                },
                {
                  key: "signature",
                  value: function (e, t) {
                    var r = this._getMessageDigest(this.options.md);
                    r.update(t, "utf8"),
                      "string" == typeof e && (e = s.privateKeyFromPem(e));
                    var n = e.sign(r);
                    return JSON.stringify({
                      signature: a.util.encode64(n),
                      md: this.options.md,
                    });
                  },
                },
                {
                  key: "verify",
                  value: function (e, t, r) {
                    if (!t) return !1;
                    var n = this._parseSignature(t),
                      i = n.signature,
                      o = n.md,
                      c = this._getMessageDigest(o);
                    return (
                      c.update(r, "utf8"),
                      (i = a.util.decode64(i)),
                      "string" == typeof e && (e = s.publicKeyFromPem(e)),
                      e.verify(c.digest().getBytes(), i)
                    );
                  },
                },
                {
                  key: "encrypt",
                  value: function (e, t, r) {
                    var n = this;
                    e = (e = i.toArray(e)).map(function (e) {
                      return "string" == typeof e ? s.publicKeyFromPem(e) : e;
                    });
                    var o = a.random.getBytesSync(32),
                      c = a.random.getBytesSync(32),
                      l = {};
                    e.forEach(function (e) {
                      var t = e.encrypt(c, "RSA-OAEP");
                      l[n.fingerprint(e)] = a.util.encode64(t);
                    });
                    var _ = a.util.createBuffer(t, "utf8"),
                      p = a.cipher.createCipher(u, c);
                    p.start({ iv: o }), p.update(_), p.finish();
                    var f = {};
                    return (
                      (f.v = i.version()),
                      (f.iv = a.util.encode64(o)),
                      (f.keys = l),
                      (f.cipher = a.util.encode64(p.output.data)),
                      (f.signature = r),
                      JSON.stringify(f)
                    );
                  },
                },
                {
                  key: "decrypt",
                  value: function (e, t) {
                    this._validate(t);
                    var r = JSON.parse(t);
                    "string" == typeof e && (e = s.privateKeyFromPem(e));
                    var n = this.fingerprint(e),
                      i = r.keys[n];
                    if (!i)
                      throw "RSA fingerprint doesn't match with any of the encrypted message's fingerprints";
                    var o = a.util.decode64(i),
                      c = a.util.decode64(r.iv),
                      l = a.util.decode64(r.cipher),
                      _ = e.decrypt(o, "RSA-OAEP"),
                      p = a.util.createBuffer(l),
                      f = a.cipher.createDecipher(u, _);
                    f.start({ iv: c }), f.update(p), f.finish();
                    var h = f.output.getBytes(),
                      d = a.util.decodeUtf8(h),
                      $ = {};
                    return ($.message = d), ($.signature = r.signature), $;
                  },
                },
                {
                  key: "_validate",
                  value: function (e) {
                    var t = JSON.parse(e);
                    if (
                      !(
                        t.hasOwnProperty("v") &&
                        t.hasOwnProperty("iv") &&
                        t.hasOwnProperty("keys") &&
                        t.hasOwnProperty("cipher")
                      )
                    )
                      throw "Encrypted message is not valid";
                  },
                },
                {
                  key: "_entropy",
                  value: function (e) {
                    var t = String(e),
                      r = a.util.encodeUtf8(t);
                    a.random.collect(r);
                  },
                },
              ]),
              n(e.prototype, t),
              r && n(e, r),
              o
            );
          })();
        t.exports = l;
      },
      { "./constants": 1, "./helpers": 3, "node-forge": 18 },
    ],
    3: [
      function (e, t, r) {
        "use strict";
        var n = e("../package.json");
        t.exports = {
          version: function () {
            return "".concat(n.name, "_").concat(n.version);
          },
          toArray: function (e) {
            return Array.isArray(e) ? e : [e];
          },
        };
      },
      { "../package.json": 52 },
    ],
    4: [
      function (e, t, r) {
        "use strict";
        function n(e, t) {
          for (var r = 0; r < t.length; r++) {
            var n = t[r];
            (n.enumerable = n.enumerable || !1),
              (n.configurable = !0),
              "value" in n && (n.writable = !0),
              Object.defineProperty(e, n.key, n);
          }
        }
        var i = e("node-forge"),
          a = i.pki,
          s = (function () {
            var e, t, r;
            function s() {
              var e =
                arguments.length > 0 && void 0 !== arguments[0]
                  ? arguments[0]
                  : {};
              (function (e, t) {
                if (!(e instanceof t))
                  throw TypeError("Cannot call a class as a function");
              })(this, s),
                (this.options = Object.assign(
                  {},
                  { keySize: 4096, rsaStandard: "RSA-OAEP", entropy: void 0 },
                  e
                )),
                this.options.entropy && this._entropy(this.options.entropy);
            }
            return (
              (e = s),
              (t = [
                {
                  key: "generateKeyPair",
                  value: function (e, t) {
                    a.rsa.generateKeyPair(
                      { bits: t || this.options.keySize, workers: -1 },
                      function (t, r) {
                        (r.publicKey = a.publicKeyToPem(r.publicKey)),
                          (r.privateKey = a.privateKeyToPem(r.privateKey)),
                          e(r);
                      }
                    );
                  },
                },
                {
                  key: "generateKeyPairAsync",
                  value: function (e) {
                    var t = this;
                    return new Promise(function (r) {
                      t.generateKeyPair(r, e);
                    });
                  },
                },
                {
                  key: "_entropy",
                  value: function (e) {
                    var t = String(e),
                      r = i.util.encodeUtf8(t);
                    i.random.collect(r);
                  },
                },
              ]),
              n(e.prototype, t),
              r && n(e, r),
              s
            );
          })();
        t.exports = s;
      },
      { "node-forge": 18 },
    ],
    5: [
      function (e, t, r) {
        "use strict";
        var n = a(e("./crypt")),
          i = a(e("./rsa"));
        function a(e) {
          return e && e.__esModule ? e : { default: e };
        }
        (window.Crypt = n.default), (window.RSA = i.default);
      },
      { "./crypt": 2, "./rsa": 4 },
    ],
    6: [function (e, t, r) {}, {}],
    7: [
      function (e, t, r) {
        var n = e("./forge");
        function i(e, t) {
          n.cipher.registerAlgorithm(e, function () {
            return new n.aes.Algorithm(e, t);
          });
        }
        e("./cipher"),
          e("./cipherModes"),
          e("./util"),
          (t.exports = n.aes = n.aes || {}),
          (n.aes.startEncrypting = function (e, t, r, n) {
            var i = h({ key: e, output: r, decrypt: !1, mode: n });
            return i.start(t), i;
          }),
          (n.aes.createEncryptionCipher = function (e, t) {
            return h({ key: e, output: null, decrypt: !1, mode: t });
          }),
          (n.aes.startDecrypting = function (e, t, r, n) {
            var i = h({ key: e, output: r, decrypt: !0, mode: n });
            return i.start(t), i;
          }),
          (n.aes.createDecryptionCipher = function (e, t) {
            return h({ key: e, output: null, decrypt: !0, mode: t });
          }),
          (n.aes.Algorithm = function (e, t) {
            l || _();
            var r = this;
            (r.name = e),
              (r.mode = new t({
                blockSize: 16,
                cipher: {
                  encrypt: function (e, t) {
                    return f(r._w, e, t, !1);
                  },
                  decrypt: function (e, t) {
                    return f(r._w, e, t, !0);
                  },
                },
              })),
              (r._init = !1);
          }),
          (n.aes.Algorithm.prototype.initialize = function (e) {
            if (!this._init) {
              var t,
                r = e.key;
              if (
                "string" != typeof r ||
                (16 !== r.length && 24 !== r.length && 32 !== r.length)
              ) {
                if (
                  n.util.isArray(r) &&
                  (16 === r.length || 24 === r.length || 32 === r.length)
                ) {
                  (t = r), (r = n.util.createBuffer());
                  for (var i = 0; i < t.length; ++i) r.putByte(t[i]);
                }
              } else r = n.util.createBuffer(r);
              if (!n.util.isArray(r)) {
                (t = r), (r = []);
                var a = t.length();
                if (16 === a || 24 === a || 32 === a)
                  for (a >>>= 2, i = 0; i < a; ++i) r.push(t.getInt32());
              }
              if (
                !n.util.isArray(r) ||
                (4 !== r.length && 6 !== r.length && 8 !== r.length)
              )
                throw Error("Invalid key parameter.");
              var s =
                -1 !== ["CFB", "OFB", "CTR", "GCM"].indexOf(this.mode.name);
              (this._w = p(r, e.decrypt && !s)), (this._init = !0);
            }
          }),
          (n.aes._expandKey = function (e, t) {
            return l || _(), p(e, t);
          }),
          (n.aes._updateBlock = f),
          i("AES-ECB", n.cipher.modes.ecb),
          i("AES-CBC", n.cipher.modes.cbc),
          i("AES-CFB", n.cipher.modes.cfb),
          i("AES-OFB", n.cipher.modes.ofb),
          i("AES-CTR", n.cipher.modes.ctr),
          i("AES-GCM", n.cipher.modes.gcm);
        var a,
          s,
          o,
          c,
          u,
          l = !1;
        function _() {
          (l = !0), (o = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54]);
          for (var e = Array(256), t = 0; t < 128; ++t)
            (e[t] = t << 1), (e[t + 128] = ((t + 128) << 1) ^ 283);
          for (
            a = Array(256), s = Array(256), c = [, , , ,], u = [, , , ,], t = 0;
            t < 4;
            ++t
          )
            (c[t] = Array(256)), (u[t] = Array(256));
          var r,
            n,
            i,
            _,
            p,
            f,
            h,
            d = 0,
            $ = 0;
          for (t = 0; t < 256; ++t) {
            (_ =
              ((_ = $ ^ ($ << 1) ^ ($ << 2) ^ ($ << 3) ^ ($ << 4)) >> 8) ^
              (255 & _) ^
              99),
              (a[d] = _),
              (s[_] = d),
              (f = ((p = e[_]) << 24) ^ (_ << 16) ^ (_ << 8) ^ _ ^ p),
              (h =
                (((r = e[d]) ^ (n = e[r]) ^ (i = e[n])) << 24) ^
                ((d ^ i) << 16) ^
                ((d ^ n ^ i) << 8) ^
                d ^
                r ^
                i);
            for (var g = 0; g < 4; ++g)
              (c[g][d] = f),
                (u[g][_] = h),
                (f = (f << 24) | (f >>> 8)),
                (h = (h << 24) | (h >>> 8));
            0 === d ? (d = $ = 1) : ((d = r ^ e[e[e[r ^ i]]]), ($ ^= e[e[$]]));
          }
        }
        function p(e, t) {
          for (
            var r,
              n = e.slice(0),
              i = 1,
              s = n.length,
              c = 4 * (s + 6 + 1),
              l = s;
            l < c;
            ++l
          )
            (r = n[l - 1]),
              l % s == 0
                ? ((r =
                    (a[(r >>> 16) & 255] << 24) ^
                    (a[(r >>> 8) & 255] << 16) ^
                    (a[255 & r] << 8) ^
                    a[r >>> 24] ^
                    (o[i] << 24)),
                  i++)
                : s > 6 &&
                  l % s == 4 &&
                  (r =
                    (a[r >>> 24] << 24) ^
                    (a[(r >>> 16) & 255] << 16) ^
                    (a[(r >>> 8) & 255] << 8) ^
                    a[255 & r]),
              (n[l] = n[l - s] ^ r);
          if (t) {
            for (
              var _,
                p = u[0],
                f = u[1],
                h = u[2],
                d = u[3],
                $ = n.slice(0),
                g = ((l = 0), (c = n.length) - 4);
              l < c;
              l += 4, g -= 4
            )
              if (0 === l || l === c - 4)
                ($[l] = n[g]),
                  ($[l + 1] = n[g + 3]),
                  ($[l + 2] = n[g + 2]),
                  ($[l + 3] = n[g + 1]);
              else
                for (var y = 0; y < 4; ++y)
                  (_ = n[g + y]),
                    ($[l + (3 & -y)] =
                      p[a[_ >>> 24]] ^
                      f[a[(_ >>> 16) & 255]] ^
                      h[a[(_ >>> 8) & 255]] ^
                      d[a[255 & _]]);
            n = $;
          }
          return n;
        }
        function f(e, t, r, n) {
          var i,
            o,
            l,
            _,
            p,
            f,
            h,
            d,
            $,
            g,
            y,
            m,
            v = e.length / 4 - 1;
          n
            ? ((i = u[0]), (o = u[1]), (l = u[2]), (_ = u[3]), (p = s))
            : ((i = c[0]), (o = c[1]), (l = c[2]), (_ = c[3]), (p = a)),
            (f = t[0] ^ e[0]),
            (h = t[n ? 3 : 1] ^ e[1]),
            (d = t[2] ^ e[2]),
            ($ = t[n ? 1 : 3] ^ e[3]);
          for (var C = 3, E = 1; E < v; ++E)
            (g =
              i[f >>> 24] ^
              o[(h >>> 16) & 255] ^
              l[(d >>> 8) & 255] ^
              _[255 & $] ^
              e[++C]),
              (y =
                i[h >>> 24] ^
                o[(d >>> 16) & 255] ^
                l[($ >>> 8) & 255] ^
                _[255 & f] ^
                e[++C]),
              (m =
                i[d >>> 24] ^
                o[($ >>> 16) & 255] ^
                l[(f >>> 8) & 255] ^
                _[255 & h] ^
                e[++C]),
              ($ =
                i[$ >>> 24] ^
                o[(f >>> 16) & 255] ^
                l[(h >>> 8) & 255] ^
                _[255 & d] ^
                e[++C]),
              (f = g),
              (h = y),
              (d = m);
          (r[0] =
            (p[f >>> 24] << 24) ^
            (p[(h >>> 16) & 255] << 16) ^
            (p[(d >>> 8) & 255] << 8) ^
            p[255 & $] ^
            e[++C]),
            (r[n ? 3 : 1] =
              (p[h >>> 24] << 24) ^
              (p[(d >>> 16) & 255] << 16) ^
              (p[($ >>> 8) & 255] << 8) ^
              p[255 & f] ^
              e[++C]),
            (r[2] =
              (p[d >>> 24] << 24) ^
              (p[($ >>> 16) & 255] << 16) ^
              (p[(f >>> 8) & 255] << 8) ^
              p[255 & h] ^
              e[++C]),
            (r[n ? 1 : 3] =
              (p[$ >>> 24] << 24) ^
              (p[(f >>> 16) & 255] << 16) ^
              (p[(h >>> 8) & 255] << 8) ^
              p[255 & d] ^
              e[++C]);
        }
        function h(e) {
          var t,
            r = "AES-" + ((e = e || {}).mode || "CBC").toUpperCase(),
            i = (t = e.decrypt
              ? n.cipher.createDecipher(r, e.key)
              : n.cipher.createCipher(r, e.key)).start;
          return (
            (t.start = function (e, r) {
              var a = null;
              r instanceof n.util.ByteBuffer && ((a = r), (r = {})),
                ((r = r || {}).output = a),
                (r.iv = e),
                i.call(t, r);
            }),
            t
          );
        }
      },
      { "./cipher": 11, "./cipherModes": 12, "./forge": 16, "./util": 48 },
    ],
    8: [
      function (e, t, r) {
        var n = e("./forge");
        e("./aes"), e("./tls");
        var i = (t.exports = n.tls);
        function a(e, t, r) {
          var a = t.entity === n.tls.ConnectionEnd.client;
          (e.read.cipherState = {
            init: !1,
            cipher: n.cipher.createDecipher(
              "AES-CBC",
              a ? r.keys.server_write_key : r.keys.client_write_key
            ),
            iv: a ? r.keys.server_write_IV : r.keys.client_write_IV,
          }),
            (e.write.cipherState = {
              init: !1,
              cipher: n.cipher.createCipher(
                "AES-CBC",
                a ? r.keys.client_write_key : r.keys.server_write_key
              ),
              iv: a ? r.keys.client_write_IV : r.keys.server_write_IV,
            }),
            (e.read.cipherFunction = u),
            (e.write.cipherFunction = s),
            (e.read.macLength = e.write.macLength = r.mac_length),
            (e.read.macFunction = e.write.macFunction = i.hmac_sha1);
        }
        function s(e, t) {
          var r,
            a = !1,
            s = t.macFunction(t.macKey, t.sequenceNumber, e);
          e.fragment.putBytes(s),
            t.updateSequenceNumber(),
            (r =
              e.version.minor === i.Versions.TLS_1_0.minor
                ? t.cipherState.init
                  ? null
                  : t.cipherState.iv
                : n.random.getBytesSync(16)),
            (t.cipherState.init = !0);
          var c = t.cipherState.cipher;
          return (
            c.start({ iv: r }),
            e.version.minor >= i.Versions.TLS_1_1.minor && c.output.putBytes(r),
            c.update(e.fragment),
            c.finish(o) &&
              ((e.fragment = c.output),
              (e.length = e.fragment.length()),
              (a = !0)),
            a
          );
        }
        function o(e, t, r) {
          if (!r) {
            var n = e - (t.length() % e);
            t.fillWithByte(n - 1, n);
          }
          return !0;
        }
        function c(e, t, r) {
          var n = !0;
          if (r) {
            for (
              var i = t.length(), a = t.last(), s = i - 1 - a;
              s < i - 1;
              ++s
            )
              n = n && t.at(s) == a;
            n && t.truncate(a + 1);
          }
          return n;
        }
        function u(e, t) {
          var r,
            a = !1;
          (r =
            e.version.minor === i.Versions.TLS_1_0.minor
              ? t.cipherState.init
                ? null
                : t.cipherState.iv
              : e.fragment.getBytes(16)),
            (t.cipherState.init = !0);
          var s = t.cipherState.cipher;
          s.start({ iv: r }), s.update(e.fragment), (a = s.finish(c));
          var o = t.macLength,
            u = n.random.getBytesSync(o),
            l = s.output.length();
          l >= o
            ? ((e.fragment = s.output.getBytes(l - o)),
              (u = s.output.getBytes(o)))
            : (e.fragment = s.output.getBytes()),
            (e.fragment = n.util.createBuffer(e.fragment)),
            (e.length = e.fragment.length());
          var _,
            p,
            f,
            h,
            d = t.macFunction(t.macKey, t.sequenceNumber, e);
          return (
            t.updateSequenceNumber(),
            (a =
              ((_ = t.macKey),
              (p = u),
              (f = d),
              (h = n.hmac.create()).start("SHA1", _),
              h.update(p),
              (p = h.digest().getBytes()),
              h.start(null, null),
              h.update(f),
              p === (f = h.digest().getBytes()) && a))
          );
        }
        (i.CipherSuites.TLS_RSA_WITH_AES_128_CBC_SHA = {
          id: [0, 47],
          name: "TLS_RSA_WITH_AES_128_CBC_SHA",
          initSecurityParameters: function (e) {
            (e.bulk_cipher_algorithm = i.BulkCipherAlgorithm.aes),
              (e.cipher_type = i.CipherType.block),
              (e.enc_key_length = 16),
              (e.block_length = 16),
              (e.fixed_iv_length = 16),
              (e.record_iv_length = 16),
              (e.mac_algorithm = i.MACAlgorithm.hmac_sha1),
              (e.mac_length = 20),
              (e.mac_key_length = 20);
          },
          initConnectionState: a,
        }),
          (i.CipherSuites.TLS_RSA_WITH_AES_256_CBC_SHA = {
            id: [0, 53],
            name: "TLS_RSA_WITH_AES_256_CBC_SHA",
            initSecurityParameters: function (e) {
              (e.bulk_cipher_algorithm = i.BulkCipherAlgorithm.aes),
                (e.cipher_type = i.CipherType.block),
                (e.enc_key_length = 32),
                (e.block_length = 16),
                (e.fixed_iv_length = 16),
                (e.record_iv_length = 16),
                (e.mac_algorithm = i.MACAlgorithm.hmac_sha1),
                (e.mac_length = 20),
                (e.mac_key_length = 20);
            },
            initConnectionState: a,
          });
      },
      { "./aes": 7, "./forge": 16, "./tls": 47 },
    ],
    9: [
      function (e, t, r) {
        var n = e("./forge");
        e("./util"), e("./oids");
        var i = (t.exports = n.asn1 = n.asn1 || {});
        function a(e, t, r) {
          if (r > t) {
            var n = Error("Too few bytes to parse DER.");
            throw (
              ((n.available = e.length()),
              (n.remaining = t),
              (n.requested = r),
              n)
            );
          }
        }
        (i.Class = {
          UNIVERSAL: 0,
          APPLICATION: 64,
          CONTEXT_SPECIFIC: 128,
          PRIVATE: 192,
        }),
          (i.Type = {
            NONE: 0,
            BOOLEAN: 1,
            INTEGER: 2,
            BITSTRING: 3,
            OCTETSTRING: 4,
            NULL: 5,
            OID: 6,
            ODESC: 7,
            EXTERNAL: 8,
            REAL: 9,
            ENUMERATED: 10,
            EMBEDDED: 11,
            UTF8: 12,
            ROID: 13,
            SEQUENCE: 16,
            SET: 17,
            PRINTABLESTRING: 19,
            IA5STRING: 22,
            UTCTIME: 23,
            GENERALIZEDTIME: 24,
            BMPSTRING: 30,
          }),
          (i.create = function (e, t, r, a, s) {
            if (n.util.isArray(a)) {
              for (var o = [], c = 0; c < a.length; ++c)
                void 0 !== a[c] && o.push(a[c]);
              a = o;
            }
            var u = {
              tagClass: e,
              type: t,
              constructed: r,
              composed: r || n.util.isArray(a),
              value: a,
            };
            return (
              s &&
                "bitStringContents" in s &&
                ((u.bitStringContents = s.bitStringContents),
                (u.original = i.copy(u))),
              u
            );
          }),
          (i.copy = function (e, t) {
            var r;
            if (n.util.isArray(e)) {
              r = [];
              for (var a = 0; a < e.length; ++a) r.push(i.copy(e[a], t));
              return r;
            }
            return "string" == typeof e
              ? e
              : ((r = {
                  tagClass: e.tagClass,
                  type: e.type,
                  constructed: e.constructed,
                  composed: e.composed,
                  value: i.copy(e.value, t),
                }),
                t &&
                  !t.excludeBitStringContents &&
                  (r.bitStringContents = e.bitStringContents),
                r);
          }),
          (i.equals = function (e, t, r) {
            if (n.util.isArray(e)) {
              if (!n.util.isArray(t) || e.length !== t.length) return !1;
              for (var a = 0; a < e.length; ++a)
                if (!i.equals(e[a], t[a])) return !1;
              return !0;
            }
            if (typeof e != typeof t) return !1;
            if ("string" == typeof e) return e === t;
            var s =
              e.tagClass === t.tagClass &&
              e.type === t.type &&
              e.constructed === t.constructed &&
              e.composed === t.composed &&
              i.equals(e.value, t.value);
            return (
              r &&
                r.includeBitStringContents &&
                (s = s && e.bitStringContents === t.bitStringContents),
              s
            );
          }),
          (i.getBerValueLength = function (e) {
            var t = e.getByte();
            if (128 !== t) return 128 & t ? e.getInt((127 & t) << 3) : t;
          });
        var s = function (e, t) {
          var r,
            n = e.getByte();
          if (128 !== n) {
            if (128 & n) {
              var i = 127 & n;
              a(e, --t, i), (r = e.getInt(i << 3));
            } else r = n;
            if (r < 0) throw Error("Negative length: " + r);
            return r;
          }
        };
        (i.fromDer = function (e, t) {
          return (
            void 0 === t && (t = { strict: !0, decodeBitStrings: !0 }),
            "boolean" == typeof t && (t = { strict: t, decodeBitStrings: !0 }),
            "strict" in t || (t.strict = !0),
            "decodeBitStrings" in t || (t.decodeBitStrings = !0),
            "string" == typeof e && (e = n.util.createBuffer(e)),
            (function e(t, r, n, o) {
              a(t, r, 2);
              var c,
                u,
                l,
                _ = t.getByte();
              r--;
              var p = 192 & _,
                f = 31 & _;
              c = t.length();
              var h = s(t, r);
              if (((r -= c - t.length()), void 0 !== h && h > r)) {
                if (o.strict) {
                  var d = Error("Too few bytes to read ASN.1 value.");
                  throw (
                    ((d.available = t.length()),
                    (d.remaining = r),
                    (d.requested = h),
                    d)
                  );
                }
                h = r;
              }
              var $ = 32 == (32 & _);
              if ($) {
                if (((u = []), void 0 === h))
                  for (;;) {
                    if (
                      (a(t, r, 2), t.bytes(2) === String.fromCharCode(0, 0))
                    ) {
                      t.getBytes(2), (r -= 2);
                      break;
                    }
                    (c = t.length()),
                      u.push(e(t, r, n + 1, o)),
                      (r -= c - t.length());
                  }
                else
                  for (; h > 0; )
                    (c = t.length()),
                      u.push(e(t, h, n + 1, o)),
                      (r -= c - t.length()),
                      (h -= c - t.length());
              }
              if (
                (void 0 === u &&
                  p === i.Class.UNIVERSAL &&
                  f === i.Type.BITSTRING &&
                  (l = t.bytes(h)),
                void 0 === u &&
                  o.decodeBitStrings &&
                  p === i.Class.UNIVERSAL &&
                  f === i.Type.BITSTRING &&
                  h > 1)
              ) {
                var g = t.read,
                  y = r,
                  m = 0;
                if (
                  (f === i.Type.BITSTRING &&
                    (a(t, r, 1), (m = t.getByte()), r--),
                  0 === m)
                )
                  try {
                    c = t.length();
                    var v = {
                        verbose: o.verbose,
                        strict: !0,
                        decodeBitStrings: !0,
                      },
                      C = e(t, r, n + 1, v),
                      E = c - t.length();
                    (r -= E), f == i.Type.BITSTRING && E++;
                    var S = C.tagClass;
                    E !== h ||
                      (S !== i.Class.UNIVERSAL &&
                        S !== i.Class.CONTEXT_SPECIFIC) ||
                      (u = [C]);
                  } catch (b) {}
                void 0 === u && ((t.read = g), (r = y));
              }
              if (void 0 === u) {
                if (void 0 === h) {
                  if (o.strict)
                    throw Error(
                      "Non-constructed ASN.1 object of indefinite length."
                    );
                  h = r;
                }
                if (f === i.Type.BMPSTRING)
                  for (u = ""; h > 0; h -= 2)
                    a(t, r, 2),
                      (u += String.fromCharCode(t.getInt16())),
                      (r -= 2);
                else u = t.getBytes(h);
              }
              var T = void 0 === l ? null : { bitStringContents: l };
              return i.create(p, f, $, u, T);
            })(e, e.length(), 0, t)
          );
        }),
          (i.toDer = function (e) {
            var t = n.util.createBuffer(),
              r = e.tagClass | e.type,
              a = n.util.createBuffer(),
              s = !1;
            if (
              ("bitStringContents" in e &&
                ((s = !0), e.original && (s = i.equals(e, e.original))),
              s)
            )
              a.putBytes(e.bitStringContents);
            else if (e.composed) {
              e.constructed ? (r |= 32) : a.putByte(0);
              for (var o = 0; o < e.value.length; ++o)
                void 0 !== e.value[o] && a.putBuffer(i.toDer(e.value[o]));
            } else if (e.type === i.Type.BMPSTRING)
              for (o = 0; o < e.value.length; ++o)
                a.putInt16(e.value.charCodeAt(o));
            else
              e.type === i.Type.INTEGER &&
              e.value.length > 1 &&
              ((0 === e.value.charCodeAt(0) &&
                0 == (128 & e.value.charCodeAt(1))) ||
                (255 === e.value.charCodeAt(0) &&
                  128 == (128 & e.value.charCodeAt(1))))
                ? a.putBytes(e.value.substr(1))
                : a.putBytes(e.value);
            if ((t.putByte(r), 127 >= a.length())) t.putByte(127 & a.length());
            else {
              var c = a.length(),
                u = "";
              do (u += String.fromCharCode(255 & c)), (c >>>= 8);
              while (c > 0);
              for (t.putByte(128 | u.length), o = u.length - 1; o >= 0; --o)
                t.putByte(u.charCodeAt(o));
            }
            return t.putBuffer(a), t;
          }),
          (i.oidToDer = function (e) {
            var t,
              r,
              i,
              a,
              s = e.split("."),
              o = n.util.createBuffer();
            o.putByte(40 * parseInt(s[0], 10) + parseInt(s[1], 10));
            for (var c = 2; c < s.length; ++c) {
              (t = !0), (r = []), (i = parseInt(s[c], 10));
              do
                (a = 127 & i), (i >>>= 7), t || (a |= 128), r.push(a), (t = !1);
              while (i > 0);
              for (var u = r.length - 1; u >= 0; --u) o.putByte(r[u]);
            }
            return o;
          }),
          (i.derToOid = function (e) {
            "string" == typeof e && (e = n.util.createBuffer(e));
            var t,
              r = e.getByte();
            t = Math.floor(r / 40) + "." + (r % 40);
            for (var i = 0; e.length() > 0; )
              (i <<= 7),
                128 & (r = e.getByte())
                  ? (i += 127 & r)
                  : ((t += "." + (i + r)), (i = 0));
            return t;
          }),
          (i.utcTimeToDate = function (e) {
            var t = new Date(),
              r = parseInt(e.substr(0, 2), 10);
            r = r >= 50 ? 1900 + r : 2e3 + r;
            var n = parseInt(e.substr(2, 2), 10) - 1,
              i = parseInt(e.substr(4, 2), 10),
              a = parseInt(e.substr(6, 2), 10),
              s = parseInt(e.substr(8, 2), 10),
              o = 0;
            if (e.length > 11) {
              var c = e.charAt(10),
                u = 10;
              "+" !== c &&
                "-" !== c &&
                ((o = parseInt(e.substr(10, 2), 10)), (u += 2));
            }
            if (
              (t.setUTCFullYear(r, n, i),
              t.setUTCHours(a, s, o, 0),
              u && ("+" === (c = e.charAt(u)) || "-" === c))
            ) {
              var l =
                60 * parseInt(e.substr(u + 1, 2), 10) +
                parseInt(e.substr(u + 4, 2), 10);
              (l *= 6e4), "+" === c ? t.setTime(+t - l) : t.setTime(+t + l);
            }
            return t;
          }),
          (i.generalizedTimeToDate = function (e) {
            var t = new Date(),
              r = parseInt(e.substr(0, 4), 10),
              n = parseInt(e.substr(4, 2), 10) - 1,
              i = parseInt(e.substr(6, 2), 10),
              a = parseInt(e.substr(8, 2), 10),
              s = parseInt(e.substr(10, 2), 10),
              o = parseInt(e.substr(12, 2), 10),
              c = 0,
              u = 0,
              l = !1;
            "Z" === e.charAt(e.length - 1) && (l = !0);
            var _ = e.length - 5,
              p = e.charAt(_);
            return (
              ("+" !== p && "-" !== p) ||
                ((u =
                  60 * parseInt(e.substr(_ + 1, 2), 10) +
                  parseInt(e.substr(_ + 4, 2), 10)),
                (u *= 6e4),
                "+" === p && (u *= -1),
                (l = !0)),
              "." === e.charAt(14) && (c = 1e3 * parseFloat(e.substr(14), 10)),
              l
                ? (t.setUTCFullYear(r, n, i),
                  t.setUTCHours(a, s, o, c),
                  t.setTime(+t + u))
                : (t.setFullYear(r, n, i), t.setHours(a, s, o, c)),
              t
            );
          }),
          (i.dateToUtcTime = function (e) {
            if ("string" == typeof e) return e;
            var t = "",
              r = [];
            r.push(("" + e.getUTCFullYear()).substr(2)),
              r.push("" + (e.getUTCMonth() + 1)),
              r.push("" + e.getUTCDate()),
              r.push("" + e.getUTCHours()),
              r.push("" + e.getUTCMinutes()),
              r.push("" + e.getUTCSeconds());
            for (var n = 0; n < r.length; ++n)
              r[n].length < 2 && (t += "0"), (t += r[n]);
            return t + "Z";
          }),
          (i.dateToGeneralizedTime = function (e) {
            if ("string" == typeof e) return e;
            var t = "",
              r = [];
            r.push("" + e.getUTCFullYear()),
              r.push("" + (e.getUTCMonth() + 1)),
              r.push("" + e.getUTCDate()),
              r.push("" + e.getUTCHours()),
              r.push("" + e.getUTCMinutes()),
              r.push("" + e.getUTCSeconds());
            for (var n = 0; n < r.length; ++n)
              r[n].length < 2 && (t += "0"), (t += r[n]);
            return t + "Z";
          }),
          (i.integerToDer = function (e) {
            var t = n.util.createBuffer();
            if (e >= -128 && e < 128) return t.putSignedInt(e, 8);
            if (e >= -32768 && e < 32768) return t.putSignedInt(e, 16);
            if (e >= -8388608 && e < 8388608) return t.putSignedInt(e, 24);
            if (e >= -2147483648 && e < 2147483648)
              return t.putSignedInt(e, 32);
            var r = Error("Integer too large; max is 32-bits.");
            throw ((r.integer = e), r);
          }),
          (i.derToInteger = function (e) {
            "string" == typeof e && (e = n.util.createBuffer(e));
            var t = 8 * e.length();
            if (t > 32) throw Error("Integer too large; max is 32-bits.");
            return e.getSignedInt(t);
          }),
          (i.validate = function (e, t, r, a) {
            var s = !1;
            if (
              (e.tagClass !== t.tagClass && void 0 !== t.tagClass) ||
              (e.type !== t.type && void 0 !== t.type)
            )
              a &&
                (e.tagClass !== t.tagClass &&
                  a.push(
                    "[" +
                      t.name +
                      '] Expected tag class "' +
                      t.tagClass +
                      '", got "' +
                      e.tagClass +
                      '"'
                  ),
                e.type !== t.type &&
                  a.push(
                    "[" +
                      t.name +
                      '] Expected type "' +
                      t.type +
                      '", got "' +
                      e.type +
                      '"'
                  ));
            else if (
              e.constructed === t.constructed ||
              void 0 === t.constructed
            ) {
              if (((s = !0), t.value && n.util.isArray(t.value)))
                for (var o = 0, c = 0; s && c < t.value.length; ++c)
                  (s = t.value[c].optional || !1),
                    e.value[o] &&
                      ((s = i.validate(e.value[o], t.value[c], r, a))
                        ? ++o
                        : t.value[c].optional && (s = !0)),
                    !s &&
                      a &&
                      a.push(
                        "[" +
                          t.name +
                          '] Tag class "' +
                          t.tagClass +
                          '", type "' +
                          t.type +
                          '" expected value length "' +
                          t.value.length +
                          '", got "' +
                          e.value.length +
                          '"'
                      );
              if (
                s &&
                r &&
                (t.capture && (r[t.capture] = e.value),
                t.captureAsn1 && (r[t.captureAsn1] = e),
                t.captureBitStringContents &&
                  "bitStringContents" in e &&
                  (r[t.captureBitStringContents] = e.bitStringContents),
                t.captureBitStringValue && "bitStringContents" in e)
              ) {
                if (e.bitStringContents.length < 2)
                  r[t.captureBitStringValue] = "";
                else {
                  if (0 !== e.bitStringContents.charCodeAt(0))
                    throw Error(
                      "captureBitStringValue only supported for zero unused bits"
                    );
                  r[t.captureBitStringValue] = e.bitStringContents.slice(1);
                }
              }
            } else
              a &&
                a.push(
                  "[" +
                    t.name +
                    '] Expected constructed "' +
                    t.constructed +
                    '", got "' +
                    e.constructed +
                    '"'
                );
            return s;
          });
        var o = /[^\\u0000-\\u00ff]/;
        i.prettyPrint = function (e, t, r) {
          var a = "";
          (r = r || 2), (t = t || 0) > 0 && (a += "\n");
          for (var s = "", c = 0; c < t * r; ++c) s += " ";
          switch (((a += s + "Tag: "), e.tagClass)) {
            case i.Class.UNIVERSAL:
              a += "Universal:";
              break;
            case i.Class.APPLICATION:
              a += "Application:";
              break;
            case i.Class.CONTEXT_SPECIFIC:
              a += "Context-Specific:";
              break;
            case i.Class.PRIVATE:
              a += "Private:";
          }
          if (e.tagClass === i.Class.UNIVERSAL)
            switch (((a += e.type), e.type)) {
              case i.Type.NONE:
                a += " (None)";
                break;
              case i.Type.BOOLEAN:
                a += " (Boolean)";
                break;
              case i.Type.INTEGER:
                a += " (Integer)";
                break;
              case i.Type.BITSTRING:
                a += " (Bit string)";
                break;
              case i.Type.OCTETSTRING:
                a += " (Octet string)";
                break;
              case i.Type.NULL:
                a += " (Null)";
                break;
              case i.Type.OID:
                a += " (Object Identifier)";
                break;
              case i.Type.ODESC:
                a += " (Object Descriptor)";
                break;
              case i.Type.EXTERNAL:
                a += " (External or Instance of)";
                break;
              case i.Type.REAL:
                a += " (Real)";
                break;
              case i.Type.ENUMERATED:
                a += " (Enumerated)";
                break;
              case i.Type.EMBEDDED:
                a += " (Embedded PDV)";
                break;
              case i.Type.UTF8:
                a += " (UTF8)";
                break;
              case i.Type.ROID:
                a += " (Relative Object Identifier)";
                break;
              case i.Type.SEQUENCE:
                a += " (Sequence)";
                break;
              case i.Type.SET:
                a += " (Set)";
                break;
              case i.Type.PRINTABLESTRING:
                a += " (Printable String)";
                break;
              case i.Type.IA5String:
                a += " (IA5String (ASCII))";
                break;
              case i.Type.UTCTIME:
                a += " (UTC time)";
                break;
              case i.Type.GENERALIZEDTIME:
                a += " (Generalized time)";
                break;
              case i.Type.BMPSTRING:
                a += " (BMP String)";
            }
          else a += e.type;
          if (
            ((a += "\n"),
            (a += s + "Constructed: " + e.constructed + "\n"),
            e.composed)
          ) {
            var u = 0,
              l = "";
            for (c = 0; c < e.value.length; ++c)
              void 0 !== e.value[c] &&
                ((u += 1),
                (l += i.prettyPrint(e.value[c], t + 1, r)),
                c + 1 < e.value.length && (l += ","));
            a += s + "Sub values: " + u + l;
          } else {
            if (((a += s + "Value: "), e.type === i.Type.OID)) {
              var _ = i.derToOid(e.value);
              (a += _),
                n.pki &&
                  n.pki.oids &&
                  _ in n.pki.oids &&
                  (a += " (" + n.pki.oids[_] + ") ");
            }
            if (e.type === i.Type.INTEGER)
              try {
                a += i.derToInteger(e.value);
              } catch (p) {
                a += "0x" + n.util.bytesToHex(e.value);
              }
            else if (e.type === i.Type.BITSTRING) {
              if (
                (e.value.length > 1
                  ? (a += "0x" + n.util.bytesToHex(e.value.slice(1)))
                  : (a += "(none)"),
                e.value.length > 0)
              ) {
                var f = e.value.charCodeAt(0);
                1 == f
                  ? (a += " (1 unused bit shown)")
                  : f > 1 && (a += " (" + f + " unused bits shown)");
              }
            } else
              e.type === i.Type.OCTETSTRING
                ? (o.test(e.value) || (a += "(" + e.value + ") "),
                  (a += "0x" + n.util.bytesToHex(e.value)))
                : e.type === i.Type.UTF8
                ? (a += n.util.decodeUtf8(e.value))
                : e.type === i.Type.PRINTABLESTRING ||
                  e.type === i.Type.IA5String
                ? (a += e.value)
                : o.test(e.value)
                ? (a += "0x" + n.util.bytesToHex(e.value))
                : 0 === e.value.length
                ? (a += "[null]")
                : (a += e.value);
          }
          return a;
        };
      },
      { "./forge": 16, "./oids": 27, "./util": 48 },
    ],
    10: [
      function (e, t, r) {
        (function (e) {
          var r = {};
          t.exports = r;
          var n = {};
          (r.encode = function (e, t, r) {
            if ("string" != typeof t)
              throw TypeError('"alphabet" must be a string.');
            if (void 0 !== r && "number" != typeof r)
              throw TypeError('"maxline" must be a number.');
            var n = "";
            if (e instanceof Uint8Array) {
              var i = 0,
                a = t.length,
                s = t.charAt(0),
                o = [0];
              for (i = 0; i < e.length; ++i) {
                for (var c = 0, u = e[i]; c < o.length; ++c)
                  (u += o[c] << 8), (o[c] = u % a), (u = (u / a) | 0);
                for (; u > 0; ) o.push(u % a), (u = (u / a) | 0);
              }
              for (i = 0; 0 === e[i] && i < e.length - 1; ++i) n += s;
              for (i = o.length - 1; i >= 0; --i) n += t[o[i]];
            } else
              n = (function (e, t) {
                var r = 0,
                  n = t.length,
                  i = t.charAt(0),
                  a = [0];
                for (r = 0; r < e.length(); ++r) {
                  for (var s = 0, o = e.at(r); s < a.length; ++s)
                    (o += a[s] << 8), (a[s] = o % n), (o = (o / n) | 0);
                  for (; o > 0; ) a.push(o % n), (o = (o / n) | 0);
                }
                var c = "";
                for (r = 0; 0 === e.at(r) && r < e.length() - 1; ++r) c += i;
                for (r = a.length - 1; r >= 0; --r) c += t[a[r]];
                return c;
              })(e, t);
            if (r) {
              var l = RegExp(".{1," + r + "}", "g");
              n = n.match(l).join("\r\n");
            }
            return n;
          }),
            (r.decode = function (t, r) {
              if ("string" != typeof t)
                throw TypeError('"input" must be a string.');
              if ("string" != typeof r)
                throw TypeError('"alphabet" must be a string.');
              var i = n[r];
              if (!i) {
                i = n[r] = [];
                for (var a = 0; a < r.length; ++a) i[r.charCodeAt(a)] = a;
              }
              t = t.replace(/\s/g, "");
              var s = r.length,
                o = r.charAt(0),
                c = [0];
              for (a = 0; a < t.length; a++) {
                var u = i[t.charCodeAt(a)];
                if (void 0 === u) return;
                for (var l = 0, _ = u; l < c.length; ++l)
                  (_ += c[l] * s), (c[l] = 255 & _), (_ >>= 8);
                for (; _ > 0; ) c.push(255 & _), (_ >>= 8);
              }
              for (var p = 0; t[p] === o && p < t.length - 1; ++p) c.push(0);
              return void 0 !== e
                ? e.from(c.reverse())
                : new Uint8Array(c.reverse());
            });
        }).call(this, e("buffer").Buffer);
      },
      { buffer: 6 },
    ],
    11: [
      function (e, t, r) {
        var n = e("./forge");
        e("./util"),
          (t.exports = n.cipher = n.cipher || {}),
          (n.cipher.algorithms = n.cipher.algorithms || {}),
          (n.cipher.createCipher = function (e, t) {
            var r = e;
            if (
              ("string" == typeof r &&
                (r = n.cipher.getAlgorithm(r)) &&
                (r = r()),
              !r)
            )
              throw Error("Unsupported algorithm: " + e);
            return new n.cipher.BlockCipher({
              algorithm: r,
              key: t,
              decrypt: !1,
            });
          }),
          (n.cipher.createDecipher = function (e, t) {
            var r = e;
            if (
              ("string" == typeof r &&
                (r = n.cipher.getAlgorithm(r)) &&
                (r = r()),
              !r)
            )
              throw Error("Unsupported algorithm: " + e);
            return new n.cipher.BlockCipher({
              algorithm: r,
              key: t,
              decrypt: !0,
            });
          }),
          (n.cipher.registerAlgorithm = function (e, t) {
            (e = e.toUpperCase()), (n.cipher.algorithms[e] = t);
          }),
          (n.cipher.getAlgorithm = function (e) {
            return (e = e.toUpperCase()) in n.cipher.algorithms
              ? n.cipher.algorithms[e]
              : null;
          });
        var i = (n.cipher.BlockCipher = function (e) {
          (this.algorithm = e.algorithm),
            (this.mode = this.algorithm.mode),
            (this.blockSize = this.mode.blockSize),
            (this._finish = !1),
            (this._input = null),
            (this.output = null),
            (this._op = e.decrypt ? this.mode.decrypt : this.mode.encrypt),
            (this._decrypt = e.decrypt),
            this.algorithm.initialize(e);
        });
        (i.prototype.start = function (e) {
          e = e || {};
          var t = {};
          for (var r in e) t[r] = e[r];
          (t.decrypt = this._decrypt),
            (this._finish = !1),
            (this._input = n.util.createBuffer()),
            (this.output = e.output || n.util.createBuffer()),
            this.mode.start(t);
        }),
          (i.prototype.update = function (e) {
            for (
              e && this._input.putBuffer(e);
              !this._op.call(
                this.mode,
                this._input,
                this.output,
                this._finish
              ) && !this._finish;

            );
            this._input.compact();
          }),
          (i.prototype.finish = function (e) {
            e &&
              ("ECB" === this.mode.name || "CBC" === this.mode.name) &&
              ((this.mode.pad = function (t) {
                return e(this.blockSize, t, !1);
              }),
              (this.mode.unpad = function (t) {
                return e(this.blockSize, t, !0);
              }));
            var t = {};
            return (
              (t.decrypt = this._decrypt),
              (t.overflow = this._input.length() % this.blockSize),
              !(
                !this._decrypt &&
                this.mode.pad &&
                !this.mode.pad(this._input, t)
              ) &&
                ((this._finish = !0),
                this.update(),
                !(
                  this._decrypt &&
                  this.mode.unpad &&
                  !this.mode.unpad(this.output, t)
                ) &&
                  !(
                    this.mode.afterFinish &&
                    !this.mode.afterFinish(this.output, t)
                  ))
            );
          });
      },
      { "./forge": 16, "./util": 48 },
    ],
    12: [
      function (e, t, r) {
        var n = e("./forge");
        e("./util"), (n.cipher = n.cipher || {});
        var i = (t.exports = n.cipher.modes = n.cipher.modes || {});
        function a(e) {
          if (
            ("string" == typeof e && (e = n.util.createBuffer(e)),
            n.util.isArray(e) && e.length > 4)
          ) {
            var t = e;
            e = n.util.createBuffer();
            for (var r = 0; r < t.length; ++r) e.putByte(t[r]);
          }
          return (
            n.util.isArray(e) ||
              (e = [e.getInt32(), e.getInt32(), e.getInt32(), e.getInt32()]),
            e
          );
        }
        function s(e) {
          e[e.length - 1] = (e[e.length - 1] + 1) & 4294967295;
        }
        function o(e) {
          return [(e / 4294967296) | 0, 4294967295 & e];
        }
        (i.ecb = function (e) {
          (e = e || {}),
            (this.name = "ECB"),
            (this.cipher = e.cipher),
            (this.blockSize = e.blockSize || 16),
            (this._ints = this.blockSize / 4),
            (this._inBlock = Array(this._ints)),
            (this._outBlock = Array(this._ints));
        }),
          (i.ecb.prototype.start = function (e) {}),
          (i.ecb.prototype.encrypt = function (e, t, r) {
            if (e.length() < this.blockSize && !(r && e.length() > 0))
              return !0;
            for (var n = 0; n < this._ints; ++n)
              this._inBlock[n] = e.getInt32();
            for (
              this.cipher.encrypt(this._inBlock, this._outBlock), n = 0;
              n < this._ints;
              ++n
            )
              t.putInt32(this._outBlock[n]);
          }),
          (i.ecb.prototype.decrypt = function (e, t, r) {
            if (e.length() < this.blockSize && !(r && e.length() > 0))
              return !0;
            for (var n = 0; n < this._ints; ++n)
              this._inBlock[n] = e.getInt32();
            for (
              this.cipher.decrypt(this._inBlock, this._outBlock), n = 0;
              n < this._ints;
              ++n
            )
              t.putInt32(this._outBlock[n]);
          }),
          (i.ecb.prototype.pad = function (e, t) {
            var r =
              e.length() === this.blockSize
                ? this.blockSize
                : this.blockSize - e.length();
            return e.fillWithByte(r, r), !0;
          }),
          (i.ecb.prototype.unpad = function (e, t) {
            if (t.overflow > 0) return !1;
            var r = e.length(),
              n = e.at(r - 1);
            return !(n > this.blockSize << 2) && (e.truncate(n), !0);
          }),
          (i.cbc = function (e) {
            (e = e || {}),
              (this.name = "CBC"),
              (this.cipher = e.cipher),
              (this.blockSize = e.blockSize || 16),
              (this._ints = this.blockSize / 4),
              (this._inBlock = Array(this._ints)),
              (this._outBlock = Array(this._ints));
          }),
          (i.cbc.prototype.start = function (e) {
            if (null === e.iv) {
              if (!this._prev) throw Error("Invalid IV parameter.");
              this._iv = this._prev.slice(0);
            } else {
              if (!("iv" in e)) throw Error("Invalid IV parameter.");
              (this._iv = a(e.iv)), (this._prev = this._iv.slice(0));
            }
          }),
          (i.cbc.prototype.encrypt = function (e, t, r) {
            if (e.length() < this.blockSize && !(r && e.length() > 0))
              return !0;
            for (var n = 0; n < this._ints; ++n)
              this._inBlock[n] = this._prev[n] ^ e.getInt32();
            for (
              this.cipher.encrypt(this._inBlock, this._outBlock), n = 0;
              n < this._ints;
              ++n
            )
              t.putInt32(this._outBlock[n]);
            this._prev = this._outBlock;
          }),
          (i.cbc.prototype.decrypt = function (e, t, r) {
            if (e.length() < this.blockSize && !(r && e.length() > 0))
              return !0;
            for (var n = 0; n < this._ints; ++n)
              this._inBlock[n] = e.getInt32();
            for (
              this.cipher.decrypt(this._inBlock, this._outBlock), n = 0;
              n < this._ints;
              ++n
            )
              t.putInt32(this._prev[n] ^ this._outBlock[n]);
            this._prev = this._inBlock.slice(0);
          }),
          (i.cbc.prototype.pad = function (e, t) {
            var r =
              e.length() === this.blockSize
                ? this.blockSize
                : this.blockSize - e.length();
            return e.fillWithByte(r, r), !0;
          }),
          (i.cbc.prototype.unpad = function (e, t) {
            if (t.overflow > 0) return !1;
            var r = e.length(),
              n = e.at(r - 1);
            return !(n > this.blockSize << 2) && (e.truncate(n), !0);
          }),
          (i.cfb = function (e) {
            (e = e || {}),
              (this.name = "CFB"),
              (this.cipher = e.cipher),
              (this.blockSize = e.blockSize || 16),
              (this._ints = this.blockSize / 4),
              (this._inBlock = null),
              (this._outBlock = Array(this._ints)),
              (this._partialBlock = Array(this._ints)),
              (this._partialOutput = n.util.createBuffer()),
              (this._partialBytes = 0);
          }),
          (i.cfb.prototype.start = function (e) {
            if (!("iv" in e)) throw Error("Invalid IV parameter.");
            (this._iv = a(e.iv)),
              (this._inBlock = this._iv.slice(0)),
              (this._partialBytes = 0);
          }),
          (i.cfb.prototype.encrypt = function (e, t, r) {
            var n = e.length();
            if (0 === n) return !0;
            if (
              (this.cipher.encrypt(this._inBlock, this._outBlock),
              0 === this._partialBytes && n >= this.blockSize)
            )
              for (var i = 0; i < this._ints; ++i)
                (this._inBlock[i] = e.getInt32() ^ this._outBlock[i]),
                  t.putInt32(this._inBlock[i]);
            else {
              var a = (this.blockSize - n) % this.blockSize;
              for (
                a > 0 && (a = this.blockSize - a),
                  this._partialOutput.clear(),
                  i = 0;
                i < this._ints;
                ++i
              )
                (this._partialBlock[i] = e.getInt32() ^ this._outBlock[i]),
                  this._partialOutput.putInt32(this._partialBlock[i]);
              if (a > 0) e.read -= this.blockSize;
              else
                for (i = 0; i < this._ints; ++i)
                  this._inBlock[i] = this._partialBlock[i];
              if (
                (this._partialBytes > 0 &&
                  this._partialOutput.getBytes(this._partialBytes),
                a > 0 && !r)
              )
                return (
                  t.putBytes(
                    this._partialOutput.getBytes(a - this._partialBytes)
                  ),
                  (this._partialBytes = a),
                  !0
                );
              t.putBytes(this._partialOutput.getBytes(n - this._partialBytes)),
                (this._partialBytes = 0);
            }
          }),
          (i.cfb.prototype.decrypt = function (e, t, r) {
            var n = e.length();
            if (0 === n) return !0;
            if (
              (this.cipher.encrypt(this._inBlock, this._outBlock),
              0 === this._partialBytes && n >= this.blockSize)
            )
              for (var i = 0; i < this._ints; ++i)
                (this._inBlock[i] = e.getInt32()),
                  t.putInt32(this._inBlock[i] ^ this._outBlock[i]);
            else {
              var a = (this.blockSize - n) % this.blockSize;
              for (
                a > 0 && (a = this.blockSize - a),
                  this._partialOutput.clear(),
                  i = 0;
                i < this._ints;
                ++i
              )
                (this._partialBlock[i] = e.getInt32()),
                  this._partialOutput.putInt32(
                    this._partialBlock[i] ^ this._outBlock[i]
                  );
              if (a > 0) e.read -= this.blockSize;
              else
                for (i = 0; i < this._ints; ++i)
                  this._inBlock[i] = this._partialBlock[i];
              if (
                (this._partialBytes > 0 &&
                  this._partialOutput.getBytes(this._partialBytes),
                a > 0 && !r)
              )
                return (
                  t.putBytes(
                    this._partialOutput.getBytes(a - this._partialBytes)
                  ),
                  (this._partialBytes = a),
                  !0
                );
              t.putBytes(this._partialOutput.getBytes(n - this._partialBytes)),
                (this._partialBytes = 0);
            }
          }),
          (i.ofb = function (e) {
            (e = e || {}),
              (this.name = "OFB"),
              (this.cipher = e.cipher),
              (this.blockSize = e.blockSize || 16),
              (this._ints = this.blockSize / 4),
              (this._inBlock = null),
              (this._outBlock = Array(this._ints)),
              (this._partialOutput = n.util.createBuffer()),
              (this._partialBytes = 0);
          }),
          (i.ofb.prototype.start = function (e) {
            if (!("iv" in e)) throw Error("Invalid IV parameter.");
            (this._iv = a(e.iv)),
              (this._inBlock = this._iv.slice(0)),
              (this._partialBytes = 0);
          }),
          (i.ofb.prototype.encrypt = function (e, t, r) {
            var n = e.length();
            if (0 === e.length()) return !0;
            if (
              (this.cipher.encrypt(this._inBlock, this._outBlock),
              0 === this._partialBytes && n >= this.blockSize)
            )
              for (var i = 0; i < this._ints; ++i)
                t.putInt32(e.getInt32() ^ this._outBlock[i]),
                  (this._inBlock[i] = this._outBlock[i]);
            else {
              var a = (this.blockSize - n) % this.blockSize;
              for (
                a > 0 && (a = this.blockSize - a),
                  this._partialOutput.clear(),
                  i = 0;
                i < this._ints;
                ++i
              )
                this._partialOutput.putInt32(e.getInt32() ^ this._outBlock[i]);
              if (a > 0) e.read -= this.blockSize;
              else
                for (i = 0; i < this._ints; ++i)
                  this._inBlock[i] = this._outBlock[i];
              if (
                (this._partialBytes > 0 &&
                  this._partialOutput.getBytes(this._partialBytes),
                a > 0 && !r)
              )
                return (
                  t.putBytes(
                    this._partialOutput.getBytes(a - this._partialBytes)
                  ),
                  (this._partialBytes = a),
                  !0
                );
              t.putBytes(this._partialOutput.getBytes(n - this._partialBytes)),
                (this._partialBytes = 0);
            }
          }),
          (i.ofb.prototype.decrypt = i.ofb.prototype.encrypt),
          (i.ctr = function (e) {
            (e = e || {}),
              (this.name = "CTR"),
              (this.cipher = e.cipher),
              (this.blockSize = e.blockSize || 16),
              (this._ints = this.blockSize / 4),
              (this._inBlock = null),
              (this._outBlock = Array(this._ints)),
              (this._partialOutput = n.util.createBuffer()),
              (this._partialBytes = 0);
          }),
          (i.ctr.prototype.start = function (e) {
            if (!("iv" in e)) throw Error("Invalid IV parameter.");
            (this._iv = a(e.iv)),
              (this._inBlock = this._iv.slice(0)),
              (this._partialBytes = 0);
          }),
          (i.ctr.prototype.encrypt = function (e, t, r) {
            var n = e.length();
            if (0 === n) return !0;
            if (
              (this.cipher.encrypt(this._inBlock, this._outBlock),
              0 === this._partialBytes && n >= this.blockSize)
            )
              for (var i = 0; i < this._ints; ++i)
                t.putInt32(e.getInt32() ^ this._outBlock[i]);
            else {
              var a = (this.blockSize - n) % this.blockSize;
              for (
                a > 0 && (a = this.blockSize - a),
                  this._partialOutput.clear(),
                  i = 0;
                i < this._ints;
                ++i
              )
                this._partialOutput.putInt32(e.getInt32() ^ this._outBlock[i]);
              if (
                (a > 0 && (e.read -= this.blockSize),
                this._partialBytes > 0 &&
                  this._partialOutput.getBytes(this._partialBytes),
                a > 0 && !r)
              )
                return (
                  t.putBytes(
                    this._partialOutput.getBytes(a - this._partialBytes)
                  ),
                  (this._partialBytes = a),
                  !0
                );
              t.putBytes(this._partialOutput.getBytes(n - this._partialBytes)),
                (this._partialBytes = 0);
            }
            s(this._inBlock);
          }),
          (i.ctr.prototype.decrypt = i.ctr.prototype.encrypt),
          (i.gcm = function (e) {
            (e = e || {}),
              (this.name = "GCM"),
              (this.cipher = e.cipher),
              (this.blockSize = e.blockSize || 16),
              (this._ints = this.blockSize / 4),
              (this._inBlock = Array(this._ints)),
              (this._outBlock = Array(this._ints)),
              (this._partialOutput = n.util.createBuffer()),
              (this._partialBytes = 0),
              (this._R = 3774873600);
          }),
          (i.gcm.prototype.start = function (e) {
            if (!("iv" in e)) throw Error("Invalid IV parameter.");
            var t,
              r = n.util.createBuffer(e.iv);
            if (
              ((this._cipherLength = 0),
              (t =
                "additionalData" in e
                  ? n.util.createBuffer(e.additionalData)
                  : n.util.createBuffer()),
              (this._tagLength = "tagLength" in e ? e.tagLength : 128),
              (this._tag = null),
              e.decrypt &&
                ((this._tag = n.util.createBuffer(e.tag).getBytes()),
                this._tag.length !== this._tagLength / 8))
            )
              throw Error("Authentication tag does not match tag length.");
            (this._hashBlock = Array(this._ints)),
              (this.tag = null),
              (this._hashSubkey = Array(this._ints)),
              this.cipher.encrypt([0, 0, 0, 0], this._hashSubkey),
              (this.componentBits = 4),
              (this._m = this.generateHashTable(
                this._hashSubkey,
                this.componentBits
              ));
            var i = r.length();
            if (12 === i)
              this._j0 = [r.getInt32(), r.getInt32(), r.getInt32(), 1];
            else {
              for (this._j0 = [0, 0, 0, 0]; r.length() > 0; )
                this._j0 = this.ghash(this._hashSubkey, this._j0, [
                  r.getInt32(),
                  r.getInt32(),
                  r.getInt32(),
                  r.getInt32(),
                ]);
              this._j0 = this.ghash(
                this._hashSubkey,
                this._j0,
                [0, 0].concat(o(8 * i))
              );
            }
            (this._inBlock = this._j0.slice(0)),
              s(this._inBlock),
              (this._partialBytes = 0),
              (t = n.util.createBuffer(t)),
              (this._aDataLength = o(8 * t.length()));
            var a = t.length() % this.blockSize;
            for (
              a && t.fillWithByte(0, this.blockSize - a),
                this._s = [0, 0, 0, 0];
              t.length() > 0;

            )
              this._s = this.ghash(this._hashSubkey, this._s, [
                t.getInt32(),
                t.getInt32(),
                t.getInt32(),
                t.getInt32(),
              ]);
          }),
          (i.gcm.prototype.encrypt = function (e, t, r) {
            var n = e.length();
            if (0 === n) return !0;
            if (
              (this.cipher.encrypt(this._inBlock, this._outBlock),
              0 === this._partialBytes && n >= this.blockSize)
            ) {
              for (var i = 0; i < this._ints; ++i)
                t.putInt32((this._outBlock[i] ^= e.getInt32()));
              this._cipherLength += this.blockSize;
            } else {
              var a = (this.blockSize - n) % this.blockSize;
              for (
                a > 0 && (a = this.blockSize - a),
                  this._partialOutput.clear(),
                  i = 0;
                i < this._ints;
                ++i
              )
                this._partialOutput.putInt32(e.getInt32() ^ this._outBlock[i]);
              if (a <= 0 || r) {
                if (r) {
                  var o = n % this.blockSize;
                  (this._cipherLength += o),
                    this._partialOutput.truncate(this.blockSize - o);
                } else this._cipherLength += this.blockSize;
                for (i = 0; i < this._ints; ++i)
                  this._outBlock[i] = this._partialOutput.getInt32();
                this._partialOutput.read -= this.blockSize;
              }
              if (
                (this._partialBytes > 0 &&
                  this._partialOutput.getBytes(this._partialBytes),
                a > 0 && !r)
              )
                return (
                  (e.read -= this.blockSize),
                  t.putBytes(
                    this._partialOutput.getBytes(a - this._partialBytes)
                  ),
                  (this._partialBytes = a),
                  !0
                );
              t.putBytes(this._partialOutput.getBytes(n - this._partialBytes)),
                (this._partialBytes = 0);
            }
            (this._s = this.ghash(this._hashSubkey, this._s, this._outBlock)),
              s(this._inBlock);
          }),
          (i.gcm.prototype.decrypt = function (e, t, r) {
            var n = e.length();
            if (n < this.blockSize && !(r && n > 0)) return !0;
            this.cipher.encrypt(this._inBlock, this._outBlock),
              s(this._inBlock),
              (this._hashBlock[0] = e.getInt32()),
              (this._hashBlock[1] = e.getInt32()),
              (this._hashBlock[2] = e.getInt32()),
              (this._hashBlock[3] = e.getInt32()),
              (this._s = this.ghash(
                this._hashSubkey,
                this._s,
                this._hashBlock
              ));
            for (var i = 0; i < this._ints; ++i)
              t.putInt32(this._outBlock[i] ^ this._hashBlock[i]);
            n < this.blockSize
              ? (this._cipherLength += n % this.blockSize)
              : (this._cipherLength += this.blockSize);
          }),
          (i.gcm.prototype.afterFinish = function (e, t) {
            var r = !0;
            t.decrypt && t.overflow && e.truncate(this.blockSize - t.overflow),
              (this.tag = n.util.createBuffer());
            var i = this._aDataLength.concat(o(8 * this._cipherLength));
            this._s = this.ghash(this._hashSubkey, this._s, i);
            var a = [];
            this.cipher.encrypt(this._j0, a);
            for (var s = 0; s < this._ints; ++s)
              this.tag.putInt32(this._s[s] ^ a[s]);
            return (
              this.tag.truncate(this.tag.length() % (this._tagLength / 8)),
              t.decrypt && this.tag.bytes() !== this._tag && (r = !1),
              r
            );
          }),
          (i.gcm.prototype.multiply = function (e, t) {
            for (var r = [0, 0, 0, 0], n = t.slice(0), i = 0; i < 128; ++i)
              e[(i / 32) | 0] & (1 << (31 - (i % 32))) &&
                ((r[0] ^= n[0]),
                (r[1] ^= n[1]),
                (r[2] ^= n[2]),
                (r[3] ^= n[3])),
                this.pow(n, n);
            return r;
          }),
          (i.gcm.prototype.pow = function (e, t) {
            for (var r = 1 & e[3], n = 3; n > 0; --n)
              t[n] = (e[n] >>> 1) | ((1 & e[n - 1]) << 31);
            (t[0] = e[0] >>> 1), r && (t[0] ^= this._R);
          }),
          (i.gcm.prototype.tableMultiply = function (e) {
            for (var t = [0, 0, 0, 0], r = 0; r < 32; ++r) {
              var n = (e[(r / 8) | 0] >>> (4 * (7 - (r % 8)))) & 15,
                i = this._m[r][n];
              (t[0] ^= i[0]), (t[1] ^= i[1]), (t[2] ^= i[2]), (t[3] ^= i[3]);
            }
            return t;
          }),
          (i.gcm.prototype.ghash = function (e, t, r) {
            return (
              (t[0] ^= r[0]),
              (t[1] ^= r[1]),
              (t[2] ^= r[2]),
              (t[3] ^= r[3]),
              this.tableMultiply(t)
            );
          }),
          (i.gcm.prototype.generateHashTable = function (e, t) {
            for (
              var r = 8 / t, n = 4 * r, i = 16 * r, a = Array(i), s = 0;
              s < i;
              ++s
            ) {
              var o = [0, 0, 0, 0],
                c = (n - 1 - (s % n)) * t;
              (o[(s / n) | 0] = (1 << (t - 1)) << c),
                (a[s] = this.generateSubHashTable(this.multiply(o, e), t));
            }
            return a;
          }),
          (i.gcm.prototype.generateSubHashTable = function (e, t) {
            var r = 1 << t,
              n = r >>> 1,
              i = Array(r);
            i[n] = e.slice(0);
            for (var a = n >>> 1; a > 0; )
              this.pow(i[2 * a], (i[a] = [])), (a >>= 1);
            for (a = 2; a < n; ) {
              for (var s = 1; s < a; ++s) {
                var o = i[a],
                  c = i[s];
                i[a + s] = [o[0] ^ c[0], o[1] ^ c[1], o[2] ^ c[2], o[3] ^ c[3]];
              }
              a *= 2;
            }
            for (i[0] = [0, 0, 0, 0], a = n + 1; a < r; ++a) {
              var u = i[a ^ n];
              i[a] = [e[0] ^ u[0], e[1] ^ u[1], e[2] ^ u[2], e[3] ^ u[3]];
            }
            return i;
          });
      },
      { "./forge": 16, "./util": 48 },
    ],
    13: [
      function (e, t, r) {
        var n = e("./forge");
        (t.exports = n.debug = n.debug || {}),
          (n.debug.storage = {}),
          (n.debug.get = function (e, t) {
            var r;
            return (
              void 0 === e
                ? (r = n.debug.storage)
                : e in n.debug.storage &&
                  (r =
                    void 0 === t ? n.debug.storage[e] : n.debug.storage[e][t]),
              r
            );
          }),
          (n.debug.set = function (e, t, r) {
            e in n.debug.storage || (n.debug.storage[e] = {}),
              (n.debug.storage[e][t] = r);
          }),
          (n.debug.clear = function (e, t) {
            void 0 === e
              ? (n.debug.storage = {})
              : e in n.debug.storage &&
                (void 0 === t
                  ? delete n.debug.storage[e]
                  : delete n.debug.storage[e][t]);
          });
      },
      { "./forge": 16 },
    ],
    14: [
      function (e, t, r) {
        var n = e("./forge");
        function i(e, t) {
          n.cipher.registerAlgorithm(e, function () {
            return new n.des.Algorithm(e, t);
          });
        }
        e("./cipher"),
          e("./cipherModes"),
          e("./util"),
          (t.exports = n.des = n.des || {}),
          (n.des.startEncrypting = function (e, t, r, n) {
            var i = h({
              key: e,
              output: r,
              decrypt: !1,
              mode: n || (null === t ? "ECB" : "CBC"),
            });
            return i.start(t), i;
          }),
          (n.des.createEncryptionCipher = function (e, t) {
            return h({ key: e, output: null, decrypt: !1, mode: t });
          }),
          (n.des.startDecrypting = function (e, t, r, n) {
            var i = h({
              key: e,
              output: r,
              decrypt: !0,
              mode: n || (null === t ? "ECB" : "CBC"),
            });
            return i.start(t), i;
          }),
          (n.des.createDecryptionCipher = function (e, t) {
            return h({ key: e, output: null, decrypt: !0, mode: t });
          }),
          (n.des.Algorithm = function (e, t) {
            var r = this;
            (r.name = e),
              (r.mode = new t({
                blockSize: 8,
                cipher: {
                  encrypt: function (e, t) {
                    return f(r._keys, e, t, !1);
                  },
                  decrypt: function (e, t) {
                    return f(r._keys, e, t, !0);
                  },
                },
              })),
              (r._init = !1);
          }),
          (n.des.Algorithm.prototype.initialize = function (e) {
            if (!this._init) {
              var t = n.util.createBuffer(e.key);
              if (0 === this.name.indexOf("3DES") && 24 !== t.length())
                throw Error("Invalid Triple-DES key size: " + 8 * t.length());
              (this._keys = (function (e) {
                for (
                  var t,
                    r = [
                      0, 4, 536870912, 536870916, 65536, 65540, 536936448,
                      536936452, 512, 516, 536871424, 536871428, 66048, 66052,
                      536936960, 536936964,
                    ],
                    n = [
                      0, 1, 1048576, 1048577, 67108864, 67108865, 68157440,
                      68157441, 256, 257, 1048832, 1048833, 67109120, 67109121,
                      68157696, 68157697,
                    ],
                    i = [
                      0, 8, 2048, 2056, 16777216, 16777224, 16779264, 16779272,
                      0, 8, 2048, 2056, 16777216, 16777224, 16779264, 16779272,
                    ],
                    a = [
                      0, 2097152, 134217728, 136314880, 8192, 2105344,
                      134225920, 136323072, 131072, 2228224, 134348800,
                      136445952, 139264, 2236416, 134356992, 136454144,
                    ],
                    s = [
                      0, 262144, 16, 262160, 0, 262144, 16, 262160, 4096,
                      266240, 4112, 266256, 4096, 266240, 4112, 266256,
                    ],
                    o = [
                      0, 1024, 32, 1056, 0, 1024, 32, 1056, 33554432, 33555456,
                      33554464, 33555488, 33554432, 33555456, 33554464,
                      33555488,
                    ],
                    c = [
                      0, 268435456, 524288, 268959744, 2, 268435458, 524290,
                      268959746, 0, 268435456, 524288, 268959744, 2, 268435458,
                      524290, 268959746,
                    ],
                    u = [
                      0, 65536, 2048, 67584, 536870912, 536936448, 536872960,
                      536938496, 131072, 196608, 133120, 198656, 537001984,
                      537067520, 537004032, 537069568,
                    ],
                    l = [
                      0, 262144, 0, 262144, 2, 262146, 2, 262146, 33554432,
                      33816576, 33554432, 33816576, 33554434, 33816578,
                      33554434, 33816578,
                    ],
                    _ = [
                      0, 268435456, 8, 268435464, 0, 268435456, 8, 268435464,
                      1024, 268436480, 1032, 268436488, 1024, 268436480, 1032,
                      268436488,
                    ],
                    p = [
                      0, 32, 0, 32, 1048576, 1048608, 1048576, 1048608, 8192,
                      8224, 8192, 8224, 1056768, 1056800, 1056768, 1056800,
                    ],
                    f = [
                      0, 16777216, 512, 16777728, 2097152, 18874368, 2097664,
                      18874880, 67108864, 83886080, 67109376, 83886592,
                      69206016, 85983232, 69206528, 85983744,
                    ],
                    h = [
                      0, 4096, 134217728, 134221824, 524288, 528384, 134742016,
                      134746112, 16, 4112, 134217744, 134221840, 524304, 528400,
                      134742032, 134746128,
                    ],
                    d = [
                      0, 4, 256, 260, 0, 4, 256, 260, 1, 5, 257, 261, 1, 5, 257,
                      261,
                    ],
                    $ = e.length() > 8 ? 3 : 1,
                    g = [],
                    y = [0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0],
                    m = 0,
                    v = 0;
                  v < $;
                  v++
                ) {
                  var C = e.getInt32(),
                    E = e.getInt32();
                  (C ^= (t = 252645135 & ((C >>> 4) ^ E)) << 4),
                    (C ^= t = 65535 & (((E ^= t) >>> -16) ^ C)),
                    (C ^= (t = 858993459 & ((C >>> 2) ^ (E ^= t << -16))) << 2),
                    (C ^= t = 65535 & (((E ^= t) >>> -16) ^ C)),
                    (C ^=
                      (t = 1431655765 & ((C >>> 1) ^ (E ^= t << -16))) << 1),
                    (C ^= t = 16711935 & (((E ^= t) >>> 8) ^ C)),
                    (t =
                      ((C ^=
                        (t = 1431655765 & ((C >>> 1) ^ (E ^= t << 8))) << 1) <<
                        8) |
                      (((E ^= t) >>> 20) & 240)),
                    (C =
                      (E << 24) |
                      ((E << 8) & 16711680) |
                      ((E >>> 8) & 65280) |
                      ((E >>> 24) & 240)),
                    (E = t);
                  for (var S = 0; S < y.length; ++S) {
                    y[S]
                      ? ((C = (C << 2) | (C >>> 26)),
                        (E = (E << 2) | (E >>> 26)))
                      : ((C = (C << 1) | (C >>> 27)),
                        (E = (E << 1) | (E >>> 27)));
                    var b =
                        r[(C &= -15) >>> 28] |
                        n[(C >>> 24) & 15] |
                        i[(C >>> 20) & 15] |
                        a[(C >>> 16) & 15] |
                        s[(C >>> 12) & 15] |
                        o[(C >>> 8) & 15] |
                        c[(C >>> 4) & 15],
                      T =
                        u[(E &= -15) >>> 28] |
                        l[(E >>> 24) & 15] |
                        _[(E >>> 20) & 15] |
                        p[(E >>> 16) & 15] |
                        f[(E >>> 12) & 15] |
                        h[(E >>> 8) & 15] |
                        d[(E >>> 4) & 15];
                    (t = 65535 & ((T >>> 16) ^ b)),
                      (g[m++] = b ^ t),
                      (g[m++] = T ^ (t << 16));
                  }
                }
                return g;
              })(t)),
                (this._init = !0);
            }
          }),
          i("DES-ECB", n.cipher.modes.ecb),
          i("DES-CBC", n.cipher.modes.cbc),
          i("DES-CFB", n.cipher.modes.cfb),
          i("DES-OFB", n.cipher.modes.ofb),
          i("DES-CTR", n.cipher.modes.ctr),
          i("3DES-ECB", n.cipher.modes.ecb),
          i("3DES-CBC", n.cipher.modes.cbc),
          i("3DES-CFB", n.cipher.modes.cfb),
          i("3DES-OFB", n.cipher.modes.ofb),
          i("3DES-CTR", n.cipher.modes.ctr);
        var a = [
            16843776, 0, 65536, 16843780, 16842756, 66564, 4, 65536, 1024,
            16843776, 16843780, 1024, 16778244, 16842756, 16777216, 4, 1028,
            16778240, 16778240, 66560, 66560, 16842752, 16842752, 16778244,
            65540, 16777220, 16777220, 65540, 0, 1028, 66564, 16777216, 65536,
            16843780, 4, 16842752, 16843776, 16777216, 16777216, 1024, 16842756,
            65536, 66560, 16777220, 1024, 4, 16778244, 66564, 16843780, 65540,
            16842752, 16778244, 16777220, 1028, 66564, 16843776, 1028, 16778240,
            16778240, 0, 65540, 66560, 0, 16842756,
          ],
          s = [
            -2146402272, -2147450880, 32768, 1081376, 1048576, 32, -2146435040,
            -2147450848, -2147483616, -2146402272, -2146402304, -2147483648,
            -2147450880, 1048576, 32, -2146435040, 1081344, 1048608,
            -2147450848, 0, -2147483648, 32768, 1081376, -2146435072, 1048608,
            -2147483616, 0, 1081344, 32800, -2146402304, -2146435072, 32800, 0,
            1081376, -2146435040, 1048576, -2147450848, -2146435072,
            -2146402304, 32768, -2146435072, -2147450880, 32, -2146402272,
            1081376, 32, 32768, -2147483648, 32800, -2146402304, 1048576,
            -2147483616, 1048608, -2147450848, -2147483616, 1048608, 1081344, 0,
            -2147450880, 32800, -2147483648, -2146435040, -2146402272, 1081344,
          ],
          o = [
            520, 134349312, 0, 134348808, 134218240, 0, 131592, 134218240,
            131080, 134217736, 134217736, 131072, 134349320, 131080, 134348800,
            520, 134217728, 8, 134349312, 512, 131584, 134348800, 134348808,
            131592, 134218248, 131584, 131072, 134218248, 8, 134349320, 512,
            134217728, 134349312, 134217728, 131080, 520, 131072, 134349312,
            134218240, 0, 512, 131080, 134349320, 134218240, 134217736, 512, 0,
            134348808, 134218248, 131072, 134217728, 134349320, 8, 131592,
            131584, 134217736, 134348800, 134218248, 520, 134348800, 131592, 8,
            134348808, 131584,
          ],
          c = [
            8396801, 8321, 8321, 128, 8396928, 8388737, 8388609, 8193, 0,
            8396800, 8396800, 8396929, 129, 0, 8388736, 8388609, 1, 8192,
            8388608, 8396801, 128, 8388608, 8193, 8320, 8388737, 1, 8320,
            8388736, 8192, 8396928, 8396929, 129, 8388736, 8388609, 8396800,
            8396929, 129, 0, 0, 8396800, 8320, 8388736, 8388737, 1, 8396801,
            8321, 8321, 128, 8396929, 129, 1, 8192, 8388609, 8193, 8396928,
            8388737, 8193, 8320, 8388608, 8396801, 128, 8388608, 8192, 8396928,
          ],
          u = [
            256, 34078976, 34078720, 1107296512, 524288, 256, 1073741824,
            34078720, 1074266368, 524288, 33554688, 1074266368, 1107296512,
            1107820544, 524544, 1073741824, 33554432, 1074266112, 1074266112, 0,
            1073742080, 1107820800, 1107820800, 33554688, 1107820544,
            1073742080, 0, 1107296256, 34078976, 33554432, 1107296256, 524544,
            524288, 1107296512, 256, 33554432, 1073741824, 34078720, 1107296512,
            1074266368, 33554688, 1073741824, 1107820544, 34078976, 1074266368,
            256, 33554432, 1107820544, 1107820800, 524544, 1107296256,
            1107820800, 34078720, 0, 1074266112, 1107296256, 524544, 33554688,
            1073742080, 524288, 0, 1074266112, 34078976, 1073742080,
          ],
          l = [
            536870928, 541065216, 16384, 541081616, 541065216, 16, 541081616,
            4194304, 536887296, 4210704, 4194304, 536870928, 4194320, 536887296,
            536870912, 16400, 0, 4194320, 536887312, 16384, 4210688, 536887312,
            16, 541065232, 541065232, 0, 4210704, 541081600, 16400, 4210688,
            541081600, 536870912, 536887296, 16, 541065232, 4210688, 541081616,
            4194304, 16400, 536870928, 4194304, 536887296, 536870912, 16400,
            536870928, 541081616, 4210688, 541065216, 4210704, 541081600, 0,
            541065232, 16, 16384, 541065216, 4210704, 16384, 4194320, 536887312,
            0, 541081600, 536870912, 4194320, 536887312,
          ],
          _ = [
            2097152, 69206018, 67110914, 0, 2048, 67110914, 2099202, 69208064,
            69208066, 2097152, 0, 67108866, 2, 67108864, 69206018, 2050,
            67110912, 2099202, 2097154, 67110912, 67108866, 69206016, 69208064,
            2097154, 69206016, 2048, 2050, 69208066, 2099200, 2, 67108864,
            2099200, 67108864, 2099200, 2097152, 67110914, 67110914, 69206018,
            69206018, 2, 2097154, 67108864, 67110912, 2097152, 69208064, 2050,
            2099202, 69208064, 2050, 67108866, 69208066, 69206016, 2099200, 0,
            2, 69208066, 0, 2099202, 69206016, 2048, 67108866, 67110912, 2048,
            2097154,
          ],
          p = [
            268439616, 4096, 262144, 268701760, 268435456, 268439616, 64,
            268435456, 262208, 268697600, 268701760, 266240, 268701696, 266304,
            4096, 64, 268697600, 268435520, 268439552, 4160, 266240, 262208,
            268697664, 268701696, 4160, 0, 0, 268697664, 268435520, 268439552,
            266304, 262144, 266304, 262144, 268701696, 4096, 64, 268697664,
            4096, 266304, 268439552, 64, 268435520, 268697600, 268697664,
            268435456, 262144, 268439616, 0, 268701760, 262208, 268435520,
            268697600, 268439552, 268439616, 0, 268701760, 266240, 266240, 4160,
            4160, 262208, 268435456, 268701696,
          ];
        function f(e, t, r, n) {
          var i,
            f,
            h = 32 === e.length ? 3 : 9;
          i =
            3 === h
              ? n
                ? [30, -2, -2]
                : [0, 32, 2]
              : n
              ? [94, 62, -2, 32, 64, 2, 30, -2, -2]
              : [0, 32, 2, 62, 30, -2, 64, 96, 2];
          var d = t[0],
            $ = t[1];
          (d ^= (f = 252645135 & ((d >>> 4) ^ $)) << 4),
            (d ^= (f = 65535 & ((d >>> 16) ^ ($ ^= f))) << 16),
            (d ^= f = 858993459 & ((($ ^= f) >>> 2) ^ d)),
            (d ^= f = 16711935 & ((($ ^= f << 2) >>> 8) ^ d)),
            (d =
              ((d ^= (f = 1431655765 & ((d >>> 1) ^ ($ ^= f << 8))) << 1) <<
                1) |
              (d >>> 31)),
            ($ = (($ ^= f) << 1) | ($ >>> 31));
          for (var g = 0; g < h; g += 3) {
            for (var y = i[g + 1], m = i[g + 2], v = i[g]; v != y; v += m) {
              var C = $ ^ e[v],
                E = (($ >>> 4) | ($ << 28)) ^ e[v + 1];
              (f = d),
                (d = $),
                ($ =
                  f ^
                  (s[(C >>> 24) & 63] |
                    c[(C >>> 16) & 63] |
                    l[(C >>> 8) & 63] |
                    p[63 & C] |
                    a[(E >>> 24) & 63] |
                    o[(E >>> 16) & 63] |
                    u[(E >>> 8) & 63] |
                    _[63 & E]));
            }
            (f = d), (d = $), ($ = f);
          }
          ($ = ($ >>> 1) | ($ << 31)),
            ($ ^= f = 1431655765 & (((d = (d >>> 1) | (d << 31)) >>> 1) ^ $)),
            ($ ^= (f = 16711935 & (($ >>> 8) ^ (d ^= f << 1))) << 8),
            ($ ^= (f = 858993459 & (($ >>> 2) ^ (d ^= f))) << 2),
            ($ ^= f = 65535 & (((d ^= f) >>> 16) ^ $)),
            ($ ^= f = 252645135 & (((d ^= f << 16) >>> 4) ^ $)),
            (d ^= f << 4),
            (r[0] = d),
            (r[1] = $);
        }
        function h(e) {
          var t,
            r = "DES-" + ((e = e || {}).mode || "CBC").toUpperCase(),
            i = (t = e.decrypt
              ? n.cipher.createDecipher(r, e.key)
              : n.cipher.createCipher(r, e.key)).start;
          return (
            (t.start = function (e, r) {
              var a = null;
              r instanceof n.util.ByteBuffer && ((a = r), (r = {})),
                ((r = r || {}).output = a),
                (r.iv = e),
                i.call(t, r);
            }),
            t
          );
        }
      },
      { "./cipher": 11, "./cipherModes": 12, "./forge": 16, "./util": 48 },
    ],
    15: [
      function (e, t, r) {
        (function (r) {
          var n = e("./forge");
          if (
            (e("./jsbn"),
            e("./random"),
            e("./sha512"),
            e("./util"),
            void 0 === i)
          )
            var i = n.jsbn.BigInteger;
          var a = n.util.ByteBuffer,
            s = void 0 === r ? Uint8Array : r;
          (n.pki = n.pki || {}),
            (t.exports = n.pki.ed25519 = n.ed25519 = n.ed25519 || {});
          var o = n.ed25519;
          function c(e) {
            var t = e.message;
            if (t instanceof Uint8Array) return t;
            var n = e.encoding;
            if (void 0 === t) {
              if (!e.md)
                throw TypeError(
                  '"options.message" or "options.md" not specified.'
                );
              (t = e.md.digest().getBytes()), (n = "binary");
            }
            if ("string" == typeof t && !n)
              throw TypeError('"options.encoding" must be "binary" or "utf8".');
            if ("string" == typeof t) {
              if (void 0 !== r) return r.from(t, n);
              t = new a(t, n);
            } else if (!(t instanceof a))
              throw TypeError(
                '"options.message" must be a node.js Buffer, a Uint8Array, a forge ByteBuffer, or a string with "options.encoding" specifying its encoding.'
              );
            for (var i = new s(t.length()), o = 0; o < i.length; ++o)
              i[o] = t.at(o);
            return i;
          }
          (o.constants = {}),
            (o.constants.PUBLIC_KEY_BYTE_LENGTH = 32),
            (o.constants.PRIVATE_KEY_BYTE_LENGTH = 64),
            (o.constants.SEED_BYTE_LENGTH = 32),
            (o.constants.SIGN_BYTE_LENGTH = 64),
            (o.constants.HASH_BYTE_LENGTH = 64),
            (o.generateKeyPair = function (e) {
              var t = (e = e || {}).seed;
              if (void 0 === t)
                t = n.random.getBytesSync(o.constants.SEED_BYTE_LENGTH);
              else if ("string" == typeof t) {
                if (t.length !== o.constants.SEED_BYTE_LENGTH)
                  throw TypeError(
                    '"seed" must be ' +
                      o.constants.SEED_BYTE_LENGTH +
                      " bytes in length."
                  );
              } else if (!(t instanceof Uint8Array))
                throw TypeError(
                  '"seed" must be a node.js Buffer, Uint8Array, or a binary string.'
                );
              t = c({ message: t, encoding: "binary" });
              for (
                var r = new s(o.constants.PUBLIC_KEY_BYTE_LENGTH),
                  i = new s(o.constants.PRIVATE_KEY_BYTE_LENGTH),
                  a = 0;
                a < 32;
                ++a
              )
                i[a] = t[a];
              return (
                (function (e, t) {
                  var r,
                    n = [L(), L(), L(), L()],
                    i = g(t, 32);
                  for (
                    i[0] &= 248,
                      i[31] &= 127,
                      i[31] |= 64,
                      B(n, i),
                      E(e, n),
                      r = 0;
                    r < 32;
                    ++r
                  )
                    t[r + 32] = e[r];
                })(r, i),
                { publicKey: r, privateKey: i }
              );
            }),
            (o.publicKeyFromPrivateKey = function (e) {
              var t = c({
                message: (e = e || {}).privateKey,
                encoding: "binary",
              });
              if (t.length !== o.constants.PRIVATE_KEY_BYTE_LENGTH)
                throw TypeError(
                  '"options.privateKey" must have a byte length of ' +
                    o.constants.PRIVATE_KEY_BYTE_LENGTH
                );
              for (
                var r = new s(o.constants.PUBLIC_KEY_BYTE_LENGTH), n = 0;
                n < r.length;
                ++n
              )
                r[n] = t[32 + n];
              return r;
            }),
            (o.sign = function (e) {
              var t = c((e = e || {})),
                r = c({ message: e.privateKey, encoding: "binary" });
              if (r.length !== o.constants.PRIVATE_KEY_BYTE_LENGTH)
                throw TypeError(
                  '"options.privateKey" must have a byte length of ' +
                    o.constants.PRIVATE_KEY_BYTE_LENGTH
                );
              var n = new s(o.constants.SIGN_BYTE_LENGTH + t.length);
              !(function (e, t, r, n) {
                var i,
                  a,
                  s = new Float64Array(64),
                  o = [L(), L(), L(), L()],
                  c = g(n, 32);
                for (c[0] &= 248, c[31] &= 127, c[31] |= 64, i = 0; i < r; ++i)
                  e[64 + i] = t[i];
                for (i = 0; i < 32; ++i) e[32 + i] = c[32 + i];
                var u = g(e.subarray(32), r + 32);
                for (m(u), B(o, u), E(e, o), i = 32; i < 64; ++i) e[i] = n[i];
                var l = g(e, r + 64);
                for (m(l), i = 32; i < 64; ++i) s[i] = 0;
                for (i = 0; i < 32; ++i) s[i] = u[i];
                for (i = 0; i < 32; ++i)
                  for (a = 0; a < 32; a++) s[i + a] += l[i] * c[a];
                y(e.subarray(32), s);
              })(n, t, t.length, r);
              for (
                var i = new s(o.constants.SIGN_BYTE_LENGTH), a = 0;
                a < i.length;
                ++a
              )
                i[a] = n[a];
              return i;
            }),
            (o.verify = function (e) {
              var t = c((e = e || {}));
              if (void 0 === e.signature)
                throw TypeError(
                  '"options.signature" must be a node.js Buffer, a Uint8Array, a forge ByteBuffer, or a binary string.'
                );
              var r = c({ message: e.signature, encoding: "binary" });
              if (r.length !== o.constants.SIGN_BYTE_LENGTH)
                throw TypeError(
                  '"options.signature" must have a byte length of ' +
                    o.constants.SIGN_BYTE_LENGTH
                );
              var n = c({ message: e.publicKey, encoding: "binary" });
              if (n.length !== o.constants.PUBLIC_KEY_BYTE_LENGTH)
                throw TypeError(
                  '"options.publicKey" must have a byte length of ' +
                    o.constants.PUBLIC_KEY_BYTE_LENGTH
                );
              var i,
                a = new s(o.constants.SIGN_BYTE_LENGTH + t.length),
                p = new s(o.constants.SIGN_BYTE_LENGTH + t.length);
              for (i = 0; i < o.constants.SIGN_BYTE_LENGTH; ++i) a[i] = r[i];
              for (i = 0; i < t.length; ++i)
                a[i + o.constants.SIGN_BYTE_LENGTH] = t[i];
              return (
                (function (e, t, r, n) {
                  var i,
                    a,
                    o,
                    c,
                    p,
                    f,
                    h,
                    d,
                    y,
                    C,
                    S = new s(32),
                    N = [L(), L(), L(), L()],
                    R = [L(), L(), L(), L()];
                  if (
                    r < 64 ||
                    ((i = R),
                    (a = n),
                    (o = L()),
                    (c = L()),
                    (p = L()),
                    (f = L()),
                    (h = L()),
                    (d = L()),
                    (y = L()),
                    (k(i[2], l),
                    (function (e, t) {
                      var r;
                      for (r = 0; r < 16; ++r)
                        e[r] = t[2 * r] + (t[2 * r + 1] << 8);
                      e[15] &= 32767;
                    })(i[1], a),
                    D(p, i[1]),
                    P(f, p, _),
                    U(p, p, i[2]),
                    w(f, i[2], f),
                    D(h, f),
                    D(d, h),
                    P(y, d, h),
                    P(o, y, p),
                    P(o, o, f),
                    (function (e, t) {
                      var r,
                        n = L();
                      for (r = 0; r < 16; ++r) n[r] = t[r];
                      for (r = 250; r >= 0; --r) D(n, n), 1 !== r && P(n, n, t);
                      for (r = 0; r < 16; ++r) e[r] = n[r];
                    })(o, o),
                    P(o, o, p),
                    P(o, o, f),
                    P(o, o, f),
                    P(i[0], o, f),
                    D(c, i[0]),
                    P(c, c, f),
                    b(c, p) && P(i[0], i[0], $),
                    D(c, i[0]),
                    P(c, c, f),
                    b(c, p))
                      ? -1
                      : (I(i[0]) === a[31] >> 7 && U(i[0], u, i[0]),
                        P(i[3], i[0], i[1]),
                        0))
                  )
                    return -1;
                  for (C = 0; C < r; ++C) e[C] = t[C];
                  for (C = 0; C < 32; ++C) e[C + 32] = n[C];
                  var V = g(e, r);
                  if (
                    (m(V),
                    A(N, R, V),
                    B(R, t.subarray(32)),
                    v(N, R),
                    E(S, N),
                    (r -= 64),
                    T(t, 0, S, 0))
                  ) {
                    for (C = 0; C < r; ++C) e[C] = 0;
                    return -1;
                  }
                  for (C = 0; C < r; ++C) e[C] = t[C + 64];
                  return r;
                })(p, a, a.length, n) >= 0
              );
            });
          var u = L(),
            l = L([1]),
            _ = L([
              30883, 4953, 19914, 30187, 55467, 16705, 2637, 112, 59544, 30585,
              16505, 36039, 65139, 11119, 27886, 20995,
            ]),
            p = L([
              61785, 9906, 39828, 60374, 45398, 33411, 5274, 224, 53552, 61171,
              33010, 6542, 64743, 22239, 55772, 9222,
            ]),
            f = L([
              54554, 36645, 11616, 51542, 42930, 38181, 51040, 26924, 56412,
              64982, 57905, 49316, 21502, 52590, 14035, 8553,
            ]),
            h = L([
              26200, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214,
              26214, 26214, 26214, 26214, 26214, 26214, 26214,
            ]),
            d = new Float64Array([
              237, 211, 245, 92, 26, 99, 18, 88, 214, 156, 247, 162, 222, 249,
              222, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16,
            ]),
            $ = L([
              41136, 18958, 6951, 50414, 58488, 44335, 6150, 12099, 55207,
              15867, 153, 11085, 57099, 20417, 9344, 11139,
            ]);
          function g(e, t) {
            var i = n.md.sha512.create(),
              c = new a(e);
            i.update(c.getBytes(t), "binary");
            var u = i.digest().getBytes();
            if (void 0 !== r) return r.from(u, "binary");
            for (
              var l = new s(o.constants.HASH_BYTE_LENGTH), _ = 0;
              _ < 64;
              ++_
            )
              l[_] = u.charCodeAt(_);
            return l;
          }
          function y(e, t) {
            var r, n, i, a;
            for (n = 63; n >= 32; --n) {
              for (r = 0, i = n - 32, a = n - 12; i < a; ++i)
                (t[i] += r - 16 * t[n] * d[i - (n - 32)]),
                  (r = (t[i] + 128) >> 8),
                  (t[i] -= 256 * r);
              (t[i] += r), (t[n] = 0);
            }
            for (r = 0, i = 0; i < 32; ++i)
              (t[i] += r - (t[31] >> 4) * d[i]), (r = t[i] >> 8), (t[i] &= 255);
            for (i = 0; i < 32; ++i) t[i] -= r * d[i];
            for (n = 0; n < 32; ++n)
              (t[n + 1] += t[n] >> 8), (e[n] = 255 & t[n]);
          }
          function m(e) {
            for (var t = new Float64Array(64), r = 0; r < 64; ++r)
              (t[r] = e[r]), (e[r] = 0);
            y(e, t);
          }
          function v(e, t) {
            var r = L(),
              n = L(),
              i = L(),
              a = L(),
              s = L(),
              o = L(),
              c = L(),
              u = L(),
              l = L();
            U(r, e[1], e[0]),
              U(l, t[1], t[0]),
              P(r, r, l),
              w(n, e[0], e[1]),
              w(l, t[0], t[1]),
              P(n, n, l),
              P(i, e[3], t[3]),
              P(i, i, p),
              P(a, e[2], t[2]),
              w(a, a, a),
              U(s, n, r),
              U(o, a, i),
              w(c, a, i),
              w(u, n, r),
              P(e[0], s, o),
              P(e[1], u, c),
              P(e[2], c, o),
              P(e[3], s, u);
          }
          function C(e, t, r) {
            for (var n = 0; n < 4; ++n) R(e[n], t[n], r);
          }
          function E(e, t) {
            var r = L(),
              n = L(),
              i = L();
            (function (e, t) {
              var r,
                n = L();
              for (r = 0; r < 16; ++r) n[r] = t[r];
              for (r = 253; r >= 0; --r)
                D(n, n), 2 !== r && 4 !== r && P(n, n, t);
              for (r = 0; r < 16; ++r) e[r] = n[r];
            })(i, t[2]),
              P(r, t[0], i),
              P(n, t[1], i),
              S(e, n),
              (e[31] ^= I(r) << 7);
          }
          function S(e, t) {
            var r,
              n,
              i,
              a = L(),
              s = L();
            for (r = 0; r < 16; ++r) s[r] = t[r];
            for (N(s), N(s), N(s), n = 0; n < 2; ++n) {
              for (a[0] = s[0] - 65517, r = 1; r < 15; ++r)
                (a[r] = s[r] - 65535 - ((a[r - 1] >> 16) & 1)),
                  (a[r - 1] &= 65535);
              (a[15] = s[15] - 32767 - ((a[14] >> 16) & 1)),
                (i = (a[15] >> 16) & 1),
                (a[14] &= 65535),
                R(s, a, 1 - i);
            }
            for (r = 0; r < 16; r++)
              (e[2 * r] = 255 & s[r]), (e[2 * r + 1] = s[r] >> 8);
          }
          function b(e, t) {
            var r = new s(32),
              n = new s(32);
            return S(r, e), S(n, t), T(r, 0, n, 0);
          }
          function T(e, t, r, n) {
            return (function (e, t, r, n, i) {
              var a,
                s = 0;
              for (a = 0; a < 32; ++a) s |= e[t + a] ^ r[n + a];
              return (1 & ((s - 1) >>> 8)) - 1;
            })(e, t, r, n, 32);
          }
          function I(e) {
            var t = new s(32);
            return S(t, e), 1 & t[0];
          }
          function A(e, t, r) {
            var n, i;
            for (
              k(e[0], u), k(e[1], l), k(e[2], l), k(e[3], u), i = 255;
              i >= 0;
              --i
            )
              C(e, t, (n = (r[(i / 8) | 0] >> (7 & i)) & 1)),
                v(t, e),
                v(e, e),
                C(e, t, n);
          }
          function B(e, t) {
            var r = [L(), L(), L(), L()];
            k(r[0], f), k(r[1], h), k(r[2], l), P(r[3], f, h), A(e, r, t);
          }
          function k(e, t) {
            var r;
            for (r = 0; r < 16; r++) e[r] = 0 | t[r];
          }
          function N(e) {
            var t,
              r,
              n = 1;
            for (t = 0; t < 16; ++t)
              (n = Math.floor((r = e[t] + n + 65535) / 65536)),
                (e[t] = r - 65536 * n);
            e[0] += n - 1 + 37 * (n - 1);
          }
          function R(e, t, r) {
            for (var n, i = ~(r - 1), a = 0; a < 16; ++a)
              (n = i & (e[a] ^ t[a])), (e[a] ^= n), (t[a] ^= n);
          }
          function L(e) {
            var t,
              r = new Float64Array(16);
            if (e) for (t = 0; t < e.length; ++t) r[t] = e[t];
            return r;
          }
          function w(e, t, r) {
            for (var n = 0; n < 16; ++n) e[n] = t[n] + r[n];
          }
          function U(e, t, r) {
            for (var n = 0; n < 16; ++n) e[n] = t[n] - r[n];
          }
          function D(e, t) {
            P(e, t, t);
          }
          function P(e, t, r) {
            var n,
              i,
              a = 0,
              s = 0,
              o = 0,
              c = 0,
              u = 0,
              l = 0,
              _ = 0,
              p = 0,
              f = 0,
              h = 0,
              d = 0,
              $ = 0,
              g = 0,
              y = 0,
              m = 0,
              v = 0,
              C = 0,
              E = 0,
              S = 0,
              b = 0,
              T = 0,
              I = 0,
              A = 0,
              B = 0,
              k = 0,
              N = 0,
              R = 0,
              L = 0,
              w = 0,
              U = 0,
              D = 0,
              P = r[0],
              V = r[1],
              O = r[2],
              x = r[3],
              K = r[4],
              M = r[5],
              F = r[6],
              j = r[7],
              H = r[8],
              q = r[9],
              G = r[10],
              z = r[11],
              Q = r[12],
              Y = r[13],
              W = r[14],
              X = r[15];
            (a += (n = t[0]) * P),
              (s += n * V),
              (o += n * O),
              (c += n * x),
              (u += n * K),
              (l += n * M),
              (_ += n * F),
              (p += n * j),
              (f += n * H),
              (h += n * q),
              (d += n * G),
              ($ += n * z),
              (g += n * Q),
              (y += n * Y),
              (m += n * W),
              (v += n * X),
              (s += (n = t[1]) * P),
              (o += n * V),
              (c += n * O),
              (u += n * x),
              (l += n * K),
              (_ += n * M),
              (p += n * F),
              (f += n * j),
              (h += n * H),
              (d += n * q),
              ($ += n * G),
              (g += n * z),
              (y += n * Q),
              (m += n * Y),
              (v += n * W),
              (C += n * X),
              (o += (n = t[2]) * P),
              (c += n * V),
              (u += n * O),
              (l += n * x),
              (_ += n * K),
              (p += n * M),
              (f += n * F),
              (h += n * j),
              (d += n * H),
              ($ += n * q),
              (g += n * G),
              (y += n * z),
              (m += n * Q),
              (v += n * Y),
              (C += n * W),
              (E += n * X),
              (c += (n = t[3]) * P),
              (u += n * V),
              (l += n * O),
              (_ += n * x),
              (p += n * K),
              (f += n * M),
              (h += n * F),
              (d += n * j),
              ($ += n * H),
              (g += n * q),
              (y += n * G),
              (m += n * z),
              (v += n * Q),
              (C += n * Y),
              (E += n * W),
              (S += n * X),
              (u += (n = t[4]) * P),
              (l += n * V),
              (_ += n * O),
              (p += n * x),
              (f += n * K),
              (h += n * M),
              (d += n * F),
              ($ += n * j),
              (g += n * H),
              (y += n * q),
              (m += n * G),
              (v += n * z),
              (C += n * Q),
              (E += n * Y),
              (S += n * W),
              (b += n * X),
              (l += (n = t[5]) * P),
              (_ += n * V),
              (p += n * O),
              (f += n * x),
              (h += n * K),
              (d += n * M),
              ($ += n * F),
              (g += n * j),
              (y += n * H),
              (m += n * q),
              (v += n * G),
              (C += n * z),
              (E += n * Q),
              (S += n * Y),
              (b += n * W),
              (T += n * X),
              (_ += (n = t[6]) * P),
              (p += n * V),
              (f += n * O),
              (h += n * x),
              (d += n * K),
              ($ += n * M),
              (g += n * F),
              (y += n * j),
              (m += n * H),
              (v += n * q),
              (C += n * G),
              (E += n * z),
              (S += n * Q),
              (b += n * Y),
              (T += n * W),
              (I += n * X),
              (p += (n = t[7]) * P),
              (f += n * V),
              (h += n * O),
              (d += n * x),
              ($ += n * K),
              (g += n * M),
              (y += n * F),
              (m += n * j),
              (v += n * H),
              (C += n * q),
              (E += n * G),
              (S += n * z),
              (b += n * Q),
              (T += n * Y),
              (I += n * W),
              (A += n * X),
              (f += (n = t[8]) * P),
              (h += n * V),
              (d += n * O),
              ($ += n * x),
              (g += n * K),
              (y += n * M),
              (m += n * F),
              (v += n * j),
              (C += n * H),
              (E += n * q),
              (S += n * G),
              (b += n * z),
              (T += n * Q),
              (I += n * Y),
              (A += n * W),
              (B += n * X),
              (h += (n = t[9]) * P),
              (d += n * V),
              ($ += n * O),
              (g += n * x),
              (y += n * K),
              (m += n * M),
              (v += n * F),
              (C += n * j),
              (E += n * H),
              (S += n * q),
              (b += n * G),
              (T += n * z),
              (I += n * Q),
              (A += n * Y),
              (B += n * W),
              (k += n * X),
              (d += (n = t[10]) * P),
              ($ += n * V),
              (g += n * O),
              (y += n * x),
              (m += n * K),
              (v += n * M),
              (C += n * F),
              (E += n * j),
              (S += n * H),
              (b += n * q),
              (T += n * G),
              (I += n * z),
              (A += n * Q),
              (B += n * Y),
              (k += n * W),
              (N += n * X),
              ($ += (n = t[11]) * P),
              (g += n * V),
              (y += n * O),
              (m += n * x),
              (v += n * K),
              (C += n * M),
              (E += n * F),
              (S += n * j),
              (b += n * H),
              (T += n * q),
              (I += n * G),
              (A += n * z),
              (B += n * Q),
              (k += n * Y),
              (N += n * W),
              (R += n * X),
              (g += (n = t[12]) * P),
              (y += n * V),
              (m += n * O),
              (v += n * x),
              (C += n * K),
              (E += n * M),
              (S += n * F),
              (b += n * j),
              (T += n * H),
              (I += n * q),
              (A += n * G),
              (B += n * z),
              (k += n * Q),
              (N += n * Y),
              (R += n * W),
              (L += n * X),
              (y += (n = t[13]) * P),
              (m += n * V),
              (v += n * O),
              (C += n * x),
              (E += n * K),
              (S += n * M),
              (b += n * F),
              (T += n * j),
              (I += n * H),
              (A += n * q),
              (B += n * G),
              (k += n * z),
              (N += n * Q),
              (R += n * Y),
              (L += n * W),
              (w += n * X),
              (m += (n = t[14]) * P),
              (v += n * V),
              (C += n * O),
              (E += n * x),
              (S += n * K),
              (b += n * M),
              (T += n * F),
              (I += n * j),
              (A += n * H),
              (B += n * q),
              (k += n * G),
              (N += n * z),
              (R += n * Q),
              (L += n * Y),
              (w += n * W),
              (U += n * X),
              (v += (n = t[15]) * P),
              (s += 38 * (E += n * O)),
              (o += 38 * (S += n * x)),
              (c += 38 * (b += n * K)),
              (u += 38 * (T += n * M)),
              (l += 38 * (I += n * F)),
              (_ += 38 * (A += n * j)),
              (p += 38 * (B += n * H)),
              (f += 38 * (k += n * q)),
              (h += 38 * (N += n * G)),
              (d += 38 * (R += n * z)),
              ($ += 38 * (L += n * Q)),
              (g += 38 * (w += n * Y)),
              (y += 38 * (U += n * W)),
              (m += 38 * (D += n * X)),
              (a =
                (n = (a += 38 * (C += n * V)) + (i = 1) + 65535) -
                65536 * (i = Math.floor(n / 65536))),
              (s = (n = s + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (o = (n = o + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (c = (n = c + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (u = (n = u + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (l = (n = l + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (_ = (n = _ + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (p = (n = p + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (f = (n = f + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (h = (n = h + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (d = (n = d + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              ($ = (n = $ + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (g = (n = g + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (y = (n = y + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (m = (n = m + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (v = (n = v + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (a =
                (n = (a += i - 1 + 37 * (i - 1)) + (i = 1) + 65535) -
                65536 * (i = Math.floor(n / 65536))),
              (s = (n = s + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (o = (n = o + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (c = (n = c + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (u = (n = u + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (l = (n = l + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (_ = (n = _ + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (p = (n = p + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (f = (n = f + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (h = (n = h + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (d = (n = d + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              ($ = (n = $ + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (g = (n = g + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (y = (n = y + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (m = (n = m + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (v = (n = v + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (a += i - 1 + 37 * (i - 1)),
              (e[0] = a),
              (e[1] = s),
              (e[2] = o),
              (e[3] = c),
              (e[4] = u),
              (e[5] = l),
              (e[6] = _),
              (e[7] = p),
              (e[8] = f),
              (e[9] = h),
              (e[10] = d),
              (e[11] = $),
              (e[12] = g),
              (e[13] = y),
              (e[14] = m),
              (e[15] = v);
          }
        }).call(this, e("buffer").Buffer);
      },
      {
        "./forge": 16,
        "./jsbn": 19,
        "./random": 39,
        "./sha512": 44,
        "./util": 48,
        buffer: 6,
      },
    ],
    16: [
      function (e, t, r) {
        t.exports = { options: { usePureJavaScript: !1 } };
      },
      {},
    ],
    17: [
      function (e, t, r) {
        var n = e("./forge");
        e("./md"),
          e("./util"),
          ((t.exports = n.hmac = n.hmac || {}).create = function () {
            var e = null,
              t = null,
              r = null,
              i = null,
              a = {
                start: function (a, s) {
                  if (null !== a) {
                    if ("string" == typeof a) {
                      if (!((a = a.toLowerCase()) in n.md.algorithms))
                        throw Error('Unknown hash algorithm "' + a + '"');
                      t = n.md.algorithms[a].create();
                    } else t = a;
                  }
                  if (null === s) s = e;
                  else {
                    if ("string" == typeof s) s = n.util.createBuffer(s);
                    else if (n.util.isArray(s)) {
                      var o = s;
                      s = n.util.createBuffer();
                      for (var c = 0; c < o.length; ++c) s.putByte(o[c]);
                    }
                    var u = s.length();
                    for (
                      u > t.blockLength &&
                        (t.start(), t.update(s.bytes()), (s = t.digest())),
                        r = n.util.createBuffer(),
                        i = n.util.createBuffer(),
                        u = s.length(),
                        c = 0;
                      c < u;
                      ++c
                    )
                      (o = s.at(c)), r.putByte(54 ^ o), i.putByte(92 ^ o);
                    if (u < t.blockLength)
                      for (o = t.blockLength - u, c = 0; c < o; ++c)
                        r.putByte(54), i.putByte(92);
                    (e = s), (r = r.bytes()), (i = i.bytes());
                  }
                  t.start(), t.update(r);
                },
                update: function (e) {
                  t.update(e);
                },
                getMac: function () {
                  var e = t.digest().bytes();
                  return t.start(), t.update(i), t.update(e), t.digest();
                },
              };
            return (a.digest = a.getMac), a;
          });
      },
      { "./forge": 16, "./md": 23, "./util": 48 },
    ],
    18: [
      function (e, t, r) {
        (t.exports = e("./forge")),
          e("./aes"),
          e("./aesCipherSuites"),
          e("./asn1"),
          e("./cipher"),
          e("./debug"),
          e("./des"),
          e("./ed25519"),
          e("./hmac"),
          e("./kem"),
          e("./log"),
          e("./md.all"),
          e("./mgf1"),
          e("./pbkdf2"),
          e("./pem"),
          e("./pkcs1"),
          e("./pkcs12"),
          e("./pkcs7"),
          e("./pki"),
          e("./prime"),
          e("./prng"),
          e("./pss"),
          e("./random"),
          e("./rc2"),
          e("./ssh"),
          e("./task"),
          e("./tls"),
          e("./util");
      },
      {
        "./aes": 7,
        "./aesCipherSuites": 8,
        "./asn1": 9,
        "./cipher": 11,
        "./debug": 13,
        "./des": 14,
        "./ed25519": 15,
        "./forge": 16,
        "./hmac": 17,
        "./kem": 20,
        "./log": 21,
        "./md.all": 22,
        "./mgf1": 26,
        "./pbkdf2": 29,
        "./pem": 30,
        "./pkcs1": 31,
        "./pkcs12": 32,
        "./pkcs7": 33,
        "./pki": 35,
        "./prime": 36,
        "./prng": 37,
        "./pss": 38,
        "./random": 39,
        "./rc2": 40,
        "./ssh": 45,
        "./task": 46,
        "./tls": 47,
        "./util": 48,
      },
    ],
    19: [
      function (e, t, r) {
        var n,
          i = e("./forge");
        function a(e, t, r) {
          (this.data = []),
            null != e &&
              ("number" == typeof e
                ? this.fromNumber(e, t, r)
                : null == t && "string" != typeof e
                ? this.fromString(e, 256)
                : this.fromString(e, t));
        }
        function s() {
          return new a(null);
        }
        function o(e, t, r, n, i, a) {
          for (var s = 16383 & t, o = t >> 14; --a >= 0; ) {
            var c = 16383 & this.data[e],
              u = this.data[e++] >> 14,
              l = o * c + u * s;
            (i =
              ((c = s * c + ((16383 & l) << 14) + r.data[n] + i) >> 28) +
              (l >> 14) +
              o * u),
              (r.data[n++] = 268435455 & c);
          }
          return i;
        }
        (t.exports = i.jsbn = i.jsbn || {}),
          (i.jsbn.BigInteger = a),
          "undefined" == typeof navigator
            ? ((a.prototype.am = o), (n = 28))
            : "Microsoft Internet Explorer" == navigator.appName
            ? ((a.prototype.am = function (e, t, r, n, i, a) {
                for (var s = 32767 & t, o = t >> 15; --a >= 0; ) {
                  var c = 32767 & this.data[e],
                    u = this.data[e++] >> 15,
                    l = o * c + u * s;
                  (i =
                    ((c =
                      s * c +
                      ((32767 & l) << 15) +
                      r.data[n] +
                      (1073741823 & i)) >>>
                      30) +
                    (l >>> 15) +
                    o * u +
                    (i >>> 30)),
                    (r.data[n++] = 1073741823 & c);
                }
                return i;
              }),
              (n = 30))
            : "Netscape" != navigator.appName
            ? ((a.prototype.am = function (e, t, r, n, i, a) {
                for (; --a >= 0; ) {
                  var s = t * this.data[e++] + r.data[n] + i;
                  (i = Math.floor(s / 67108864)), (r.data[n++] = 67108863 & s);
                }
                return i;
              }),
              (n = 26))
            : ((a.prototype.am = o), (n = 28)),
          (a.prototype.DB = n),
          (a.prototype.DM = (1 << n) - 1),
          (a.prototype.DV = 1 << n),
          (a.prototype.FV = 4503599627370496),
          (a.prototype.F1 = 52 - n),
          (a.prototype.F2 = 2 * n - 52);
        var c,
          u,
          l = [];
        for (c = 48, u = 0; u <= 9; ++u) l[c++] = u;
        for (c = 97, u = 10; u < 36; ++u) l[c++] = u;
        for (c = 65, u = 10; u < 36; ++u) l[c++] = u;
        function _(e) {
          return "0123456789abcdefghijklmnopqrstuvwxyz".charAt(e);
        }
        function p(e, t) {
          var r = l[e.charCodeAt(t)];
          return null == r ? -1 : r;
        }
        function f(e) {
          var t = s();
          return t.fromInt(e), t;
        }
        function h(e) {
          var t,
            r = 1;
          return (
            0 != (t = e >>> 16) && ((e = t), (r += 16)),
            0 != (t = e >> 8) && ((e = t), (r += 8)),
            0 != (t = e >> 4) && ((e = t), (r += 4)),
            0 != (t = e >> 2) && ((e = t), (r += 2)),
            0 != (t = e >> 1) && ((e = t), (r += 1)),
            r
          );
        }
        function d(e) {
          this.m = e;
        }
        function $(e) {
          (this.m = e),
            (this.mp = e.invDigit()),
            (this.mpl = 32767 & this.mp),
            (this.mph = this.mp >> 15),
            (this.um = (1 << (e.DB - 15)) - 1),
            (this.mt2 = 2 * e.t);
        }
        function g(e, t) {
          return e & t;
        }
        function y(e, t) {
          return e | t;
        }
        function m(e, t) {
          return e ^ t;
        }
        function v(e, t) {
          return e & ~t;
        }
        function C(e) {
          if (0 == e) return -1;
          var t = 0;
          return (
            0 == (65535 & e) && ((e >>= 16), (t += 16)),
            0 == (255 & e) && ((e >>= 8), (t += 8)),
            0 == (15 & e) && ((e >>= 4), (t += 4)),
            0 == (3 & e) && ((e >>= 2), (t += 2)),
            0 == (1 & e) && ++t,
            t
          );
        }
        function E(e) {
          for (var t = 0; 0 != e; ) (e &= e - 1), ++t;
          return t;
        }
        function S() {}
        function b(e) {
          return e;
        }
        function T(e) {
          (this.r2 = s()),
            (this.q3 = s()),
            a.ONE.dlShiftTo(2 * e.t, this.r2),
            (this.mu = this.r2.divide(e)),
            (this.m = e);
        }
        (d.prototype.convert = function (e) {
          return e.s < 0 || e.compareTo(this.m) >= 0 ? e.mod(this.m) : e;
        }),
          (d.prototype.revert = function (e) {
            return e;
          }),
          (d.prototype.reduce = function (e) {
            e.divRemTo(this.m, null, e);
          }),
          (d.prototype.mulTo = function (e, t, r) {
            e.multiplyTo(t, r), this.reduce(r);
          }),
          (d.prototype.sqrTo = function (e, t) {
            e.squareTo(t), this.reduce(t);
          }),
          ($.prototype.convert = function (e) {
            var t = s();
            return (
              e.abs().dlShiftTo(this.m.t, t),
              t.divRemTo(this.m, null, t),
              e.s < 0 && t.compareTo(a.ZERO) > 0 && this.m.subTo(t, t),
              t
            );
          }),
          ($.prototype.revert = function (e) {
            var t = s();
            return e.copyTo(t), this.reduce(t), t;
          }),
          ($.prototype.reduce = function (e) {
            for (; e.t <= this.mt2; ) e.data[e.t++] = 0;
            for (var t = 0; t < this.m.t; ++t) {
              var r = 32767 & e.data[t],
                n =
                  (r * this.mpl +
                    (((r * this.mph + (e.data[t] >> 15) * this.mpl) &
                      this.um) <<
                      15)) &
                  e.DM;
              for (
                r = t + this.m.t,
                  e.data[r] += this.m.am(0, n, e, t, 0, this.m.t);
                e.data[r] >= e.DV;

              )
                (e.data[r] -= e.DV), e.data[++r]++;
            }
            e.clamp(),
              e.drShiftTo(this.m.t, e),
              e.compareTo(this.m) >= 0 && e.subTo(this.m, e);
          }),
          ($.prototype.mulTo = function (e, t, r) {
            e.multiplyTo(t, r), this.reduce(r);
          }),
          ($.prototype.sqrTo = function (e, t) {
            e.squareTo(t), this.reduce(t);
          }),
          (a.prototype.copyTo = function (e) {
            for (var t = this.t - 1; t >= 0; --t) e.data[t] = this.data[t];
            (e.t = this.t), (e.s = this.s);
          }),
          (a.prototype.fromInt = function (e) {
            (this.t = 1),
              (this.s = e < 0 ? -1 : 0),
              e > 0
                ? (this.data[0] = e)
                : e < -1
                ? (this.data[0] = e + this.DV)
                : (this.t = 0);
          }),
          (a.prototype.fromString = function (e, t) {
            var r;
            if (16 == t) r = 4;
            else if (8 == t) r = 3;
            else if (256 == t) r = 8;
            else if (2 == t) r = 1;
            else if (32 == t) r = 5;
            else {
              if (4 != t) return void this.fromRadix(e, t);
              r = 2;
            }
            (this.t = 0), (this.s = 0);
            for (var n = e.length, i = !1, s = 0; --n >= 0; ) {
              var o = 8 == r ? 255 & e[n] : p(e, n);
              o < 0
                ? "-" == e.charAt(n) && (i = !0)
                : ((i = !1),
                  0 == s
                    ? (this.data[this.t++] = o)
                    : s + r > this.DB
                    ? ((this.data[this.t - 1] |=
                        (o & ((1 << (this.DB - s)) - 1)) << s),
                      (this.data[this.t++] = o >> (this.DB - s)))
                    : (this.data[this.t - 1] |= o << s),
                  (s += r) >= this.DB && (s -= this.DB));
            }
            8 == r &&
              0 != (128 & e[0]) &&
              ((this.s = -1),
              s > 0 &&
                (this.data[this.t - 1] |= ((1 << (this.DB - s)) - 1) << s)),
              this.clamp(),
              i && a.ZERO.subTo(this, this);
          }),
          (a.prototype.clamp = function () {
            for (
              var e = this.s & this.DM;
              this.t > 0 && this.data[this.t - 1] == e;

            )
              --this.t;
          }),
          (a.prototype.dlShiftTo = function (e, t) {
            var r;
            for (r = this.t - 1; r >= 0; --r) t.data[r + e] = this.data[r];
            for (r = e - 1; r >= 0; --r) t.data[r] = 0;
            (t.t = this.t + e), (t.s = this.s);
          }),
          (a.prototype.drShiftTo = function (e, t) {
            for (var r = e; r < this.t; ++r) t.data[r - e] = this.data[r];
            (t.t = Math.max(this.t - e, 0)), (t.s = this.s);
          }),
          (a.prototype.lShiftTo = function (e, t) {
            var r,
              n = e % this.DB,
              i = this.DB - n,
              a = (1 << i) - 1,
              s = Math.floor(e / this.DB),
              o = (this.s << n) & this.DM;
            for (r = this.t - 1; r >= 0; --r)
              (t.data[r + s + 1] = (this.data[r] >> i) | o),
                (o = (this.data[r] & a) << n);
            for (r = s - 1; r >= 0; --r) t.data[r] = 0;
            (t.data[s] = o), (t.t = this.t + s + 1), (t.s = this.s), t.clamp();
          }),
          (a.prototype.rShiftTo = function (e, t) {
            t.s = this.s;
            var r = Math.floor(e / this.DB);
            if (r >= this.t) t.t = 0;
            else {
              var n = e % this.DB,
                i = this.DB - n,
                a = (1 << n) - 1;
              t.data[0] = this.data[r] >> n;
              for (var s = r + 1; s < this.t; ++s)
                (t.data[s - r - 1] |= (this.data[s] & a) << i),
                  (t.data[s - r] = this.data[s] >> n);
              n > 0 && (t.data[this.t - r - 1] |= (this.s & a) << i),
                (t.t = this.t - r),
                t.clamp();
            }
          }),
          (a.prototype.subTo = function (e, t) {
            for (var r = 0, n = 0, i = Math.min(e.t, this.t); r < i; )
              (n += this.data[r] - e.data[r]),
                (t.data[r++] = n & this.DM),
                (n >>= this.DB);
            if (e.t < this.t) {
              for (n -= e.s; r < this.t; )
                (n += this.data[r]),
                  (t.data[r++] = n & this.DM),
                  (n >>= this.DB);
              n += this.s;
            } else {
              for (n += this.s; r < e.t; )
                (n -= e.data[r]), (t.data[r++] = n & this.DM), (n >>= this.DB);
              n -= e.s;
            }
            (t.s = n < 0 ? -1 : 0),
              n < -1 ? (t.data[r++] = this.DV + n) : n > 0 && (t.data[r++] = n),
              (t.t = r),
              t.clamp();
          }),
          (a.prototype.multiplyTo = function (e, t) {
            var r = this.abs(),
              n = e.abs(),
              i = r.t;
            for (t.t = i + n.t; --i >= 0; ) t.data[i] = 0;
            for (i = 0; i < n.t; ++i)
              t.data[i + r.t] = r.am(0, n.data[i], t, i, 0, r.t);
            (t.s = 0), t.clamp(), this.s != e.s && a.ZERO.subTo(t, t);
          }),
          (a.prototype.squareTo = function (e) {
            for (var t = this.abs(), r = (e.t = 2 * t.t); --r >= 0; )
              e.data[r] = 0;
            for (r = 0; r < t.t - 1; ++r) {
              var n = t.am(r, t.data[r], e, 2 * r, 0, 1);
              (e.data[r + t.t] += t.am(
                r + 1,
                2 * t.data[r],
                e,
                2 * r + 1,
                n,
                t.t - r - 1
              )) >= t.DV &&
                ((e.data[r + t.t] -= t.DV), (e.data[r + t.t + 1] = 1));
            }
            e.t > 0 && (e.data[e.t - 1] += t.am(r, t.data[r], e, 2 * r, 0, 1)),
              (e.s = 0),
              e.clamp();
          }),
          (a.prototype.divRemTo = function (e, t, r) {
            var n = e.abs();
            if (!(n.t <= 0)) {
              var i = this.abs();
              if (i.t < n.t)
                return (
                  null != t && t.fromInt(0), void (null != r && this.copyTo(r))
                );
              null == r && (r = s());
              var o = s(),
                c = this.s,
                u = e.s,
                l = this.DB - h(n.data[n.t - 1]);
              l > 0
                ? (n.lShiftTo(l, o), i.lShiftTo(l, r))
                : (n.copyTo(o), i.copyTo(r));
              var _ = o.t,
                p = o.data[_ - 1];
              if (0 != p) {
                var f =
                    p * (1 << this.F1) + (_ > 1 ? o.data[_ - 2] >> this.F2 : 0),
                  d = this.FV / f,
                  $ = (1 << this.F1) / f,
                  g = 1 << this.F2,
                  y = r.t,
                  m = y - _,
                  v = null == t ? s() : t;
                for (
                  o.dlShiftTo(m, v),
                    r.compareTo(v) >= 0 && ((r.data[r.t++] = 1), r.subTo(v, r)),
                    a.ONE.dlShiftTo(_, v),
                    v.subTo(o, o);
                  o.t < _;

                )
                  o.data[o.t++] = 0;
                for (; --m >= 0; ) {
                  var C =
                    r.data[--y] == p
                      ? this.DM
                      : Math.floor(r.data[y] * d + (r.data[y - 1] + g) * $);
                  if ((r.data[y] += o.am(0, C, r, m, 0, _)) < C)
                    for (o.dlShiftTo(m, v), r.subTo(v, r); r.data[y] < --C; )
                      r.subTo(v, r);
                }
                null != t && (r.drShiftTo(_, t), c != u && a.ZERO.subTo(t, t)),
                  (r.t = _),
                  r.clamp(),
                  l > 0 && r.rShiftTo(l, r),
                  c < 0 && a.ZERO.subTo(r, r);
              }
            }
          }),
          (a.prototype.invDigit = function () {
            if (this.t < 1) return 0;
            var e = this.data[0];
            if (0 == (1 & e)) return 0;
            var t = 3 & e;
            return (t =
              ((t =
                ((t =
                  ((t = (t * (2 - (15 & e) * t)) & 15) * (2 - (255 & e) * t)) &
                  255) *
                  (2 - (((65535 & e) * t) & 65535))) &
                65535) *
                (2 - ((e * t) % this.DV))) %
              this.DV) > 0
              ? this.DV - t
              : -t;
          }),
          (a.prototype.isEven = function () {
            return 0 == (this.t > 0 ? 1 & this.data[0] : this.s);
          }),
          (a.prototype.exp = function (e, t) {
            if (e > 4294967295 || e < 1) return a.ONE;
            var r = s(),
              n = s(),
              i = t.convert(this),
              o = h(e) - 1;
            for (i.copyTo(r); --o >= 0; )
              if ((t.sqrTo(r, n), (e & (1 << o)) > 0)) t.mulTo(n, i, r);
              else {
                var c = r;
                (r = n), (n = c);
              }
            return t.revert(r);
          }),
          (a.prototype.toString = function (e) {
            if (this.s < 0) return "-" + this.negate().toString(e);
            if (16 == e) t = 4;
            else if (8 == e) t = 3;
            else if (2 == e) t = 1;
            else if (32 == e) t = 5;
            else {
              if (4 != e) return this.toRadix(e);
              t = 2;
            }
            var t,
              r,
              n = (1 << t) - 1,
              i = !1,
              a = "",
              s = this.t,
              o = this.DB - ((s * this.DB) % t);
            if (s-- > 0)
              for (
                o < this.DB &&
                (r = this.data[s] >> o) > 0 &&
                ((i = !0), (a = _(r)));
                s >= 0;

              )
                o < t
                  ? ((r = (this.data[s] & ((1 << o) - 1)) << (t - o)),
                    (r |= this.data[--s] >> (o += this.DB - t)))
                  : ((r = (this.data[s] >> (o -= t)) & n),
                    o <= 0 && ((o += this.DB), --s)),
                  r > 0 && (i = !0),
                  i && (a += _(r));
            return i ? a : "0";
          }),
          (a.prototype.negate = function () {
            var e = s();
            return a.ZERO.subTo(this, e), e;
          }),
          (a.prototype.abs = function () {
            return this.s < 0 ? this.negate() : this;
          }),
          (a.prototype.compareTo = function (e) {
            var t = this.s - e.s;
            if (0 != t) return t;
            var r = this.t;
            if (0 != (t = r - e.t)) return this.s < 0 ? -t : t;
            for (; --r >= 0; )
              if (0 != (t = this.data[r] - e.data[r])) return t;
            return 0;
          }),
          (a.prototype.bitLength = function () {
            return this.t <= 0
              ? 0
              : this.DB * (this.t - 1) +
                  h(this.data[this.t - 1] ^ (this.s & this.DM));
          }),
          (a.prototype.mod = function (e) {
            var t = s();
            return (
              this.abs().divRemTo(e, null, t),
              this.s < 0 && t.compareTo(a.ZERO) > 0 && e.subTo(t, t),
              t
            );
          }),
          (a.prototype.modPowInt = function (e, t) {
            var r;
            return (
              (r = e < 256 || t.isEven() ? new d(t) : new $(t)), this.exp(e, r)
            );
          }),
          (a.ZERO = f(0)),
          (a.ONE = f(1)),
          (S.prototype.convert = b),
          (S.prototype.revert = b),
          (S.prototype.mulTo = function (e, t, r) {
            e.multiplyTo(t, r);
          }),
          (S.prototype.sqrTo = function (e, t) {
            e.squareTo(t);
          }),
          (T.prototype.convert = function (e) {
            if (e.s < 0 || e.t > 2 * this.m.t) return e.mod(this.m);
            if (0 > e.compareTo(this.m)) return e;
            var t = s();
            return e.copyTo(t), this.reduce(t), t;
          }),
          (T.prototype.revert = function (e) {
            return e;
          }),
          (T.prototype.reduce = function (e) {
            for (
              e.drShiftTo(this.m.t - 1, this.r2),
                e.t > this.m.t + 1 && ((e.t = this.m.t + 1), e.clamp()),
                this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3),
                this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
              0 > e.compareTo(this.r2);

            )
              e.dAddOffset(1, this.m.t + 1);
            for (e.subTo(this.r2, e); e.compareTo(this.m) >= 0; )
              e.subTo(this.m, e);
          }),
          (T.prototype.mulTo = function (e, t, r) {
            e.multiplyTo(t, r), this.reduce(r);
          }),
          (T.prototype.sqrTo = function (e, t) {
            e.squareTo(t), this.reduce(t);
          });
        var I = [
            2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61,
            67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137,
            139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199,
            211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277,
            281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359,
            367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439,
            443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509,
          ],
          A = 67108864 / I[I.length - 1];
        (a.prototype.chunkSize = function (e) {
          return Math.floor((Math.LN2 * this.DB) / Math.log(e));
        }),
          (a.prototype.toRadix = function (e) {
            if ((null == e && (e = 10), 0 == this.signum() || e < 2 || e > 36))
              return "0";
            var t = this.chunkSize(e),
              r = Math.pow(e, t),
              n = f(r),
              i = s(),
              a = s(),
              o = "";
            for (this.divRemTo(n, i, a); i.signum() > 0; )
              (o = (r + a.intValue()).toString(e).substr(1) + o),
                i.divRemTo(n, i, a);
            return a.intValue().toString(e) + o;
          }),
          (a.prototype.fromRadix = function (e, t) {
            this.fromInt(0), null == t && (t = 10);
            for (
              var r = this.chunkSize(t),
                n = Math.pow(t, r),
                i = !1,
                s = 0,
                o = 0,
                c = 0;
              c < e.length;
              ++c
            ) {
              var u = p(e, c);
              u < 0
                ? "-" == e.charAt(c) && 0 == this.signum() && (i = !0)
                : ((o = t * o + u),
                  ++s >= r &&
                    (this.dMultiply(n),
                    this.dAddOffset(o, 0),
                    (s = 0),
                    (o = 0)));
            }
            s > 0 && (this.dMultiply(Math.pow(t, s)), this.dAddOffset(o, 0)),
              i && a.ZERO.subTo(this, this);
          }),
          (a.prototype.fromNumber = function (e, t, r) {
            if ("number" == typeof t) {
              if (e < 2) this.fromInt(1);
              else
                for (
                  this.fromNumber(e, r),
                    this.testBit(e - 1) ||
                      this.bitwiseTo(a.ONE.shiftLeft(e - 1), y, this),
                    this.isEven() && this.dAddOffset(1, 0);
                  !this.isProbablePrime(t);

                )
                  this.dAddOffset(2, 0),
                    this.bitLength() > e &&
                      this.subTo(a.ONE.shiftLeft(e - 1), this);
            } else {
              var n = [],
                i = 7 & e;
              (n.length = 1 + (e >> 3)),
                t.nextBytes(n),
                i > 0 ? (n[0] &= (1 << i) - 1) : (n[0] = 0),
                this.fromString(n, 256);
            }
          }),
          (a.prototype.bitwiseTo = function (e, t, r) {
            var n,
              i,
              a = Math.min(e.t, this.t);
            for (n = 0; n < a; ++n) r.data[n] = t(this.data[n], e.data[n]);
            if (e.t < this.t) {
              for (i = e.s & this.DM, n = a; n < this.t; ++n)
                r.data[n] = t(this.data[n], i);
              r.t = this.t;
            } else {
              for (i = this.s & this.DM, n = a; n < e.t; ++n)
                r.data[n] = t(i, e.data[n]);
              r.t = e.t;
            }
            (r.s = t(this.s, e.s)), r.clamp();
          }),
          (a.prototype.changeBit = function (e, t) {
            var r = a.ONE.shiftLeft(e);
            return this.bitwiseTo(r, t, r), r;
          }),
          (a.prototype.addTo = function (e, t) {
            for (var r = 0, n = 0, i = Math.min(e.t, this.t); r < i; )
              (n += this.data[r] + e.data[r]),
                (t.data[r++] = n & this.DM),
                (n >>= this.DB);
            if (e.t < this.t) {
              for (n += e.s; r < this.t; )
                (n += this.data[r]),
                  (t.data[r++] = n & this.DM),
                  (n >>= this.DB);
              n += this.s;
            } else {
              for (n += this.s; r < e.t; )
                (n += e.data[r]), (t.data[r++] = n & this.DM), (n >>= this.DB);
              n += e.s;
            }
            (t.s = n < 0 ? -1 : 0),
              n > 0 ? (t.data[r++] = n) : n < -1 && (t.data[r++] = this.DV + n),
              (t.t = r),
              t.clamp();
          }),
          (a.prototype.dMultiply = function (e) {
            (this.data[this.t] = this.am(0, e - 1, this, 0, 0, this.t)),
              ++this.t,
              this.clamp();
          }),
          (a.prototype.dAddOffset = function (e, t) {
            if (0 != e) {
              for (; this.t <= t; ) this.data[this.t++] = 0;
              for (this.data[t] += e; this.data[t] >= this.DV; )
                (this.data[t] -= this.DV),
                  ++t >= this.t && (this.data[this.t++] = 0),
                  ++this.data[t];
            }
          }),
          (a.prototype.multiplyLowerTo = function (e, t, r) {
            var n,
              i = Math.min(this.t + e.t, t);
            for (r.s = 0, r.t = i; i > 0; ) r.data[--i] = 0;
            for (n = r.t - this.t; i < n; ++i)
              r.data[i + this.t] = this.am(0, e.data[i], r, i, 0, this.t);
            for (n = Math.min(e.t, t); i < n; ++i)
              this.am(0, e.data[i], r, i, 0, t - i);
            r.clamp();
          }),
          (a.prototype.multiplyUpperTo = function (e, t, r) {
            --t;
            var n = (r.t = this.t + e.t - t);
            for (r.s = 0; --n >= 0; ) r.data[n] = 0;
            for (n = Math.max(t - this.t, 0); n < e.t; ++n)
              r.data[this.t + n - t] = this.am(
                t - n,
                e.data[n],
                r,
                0,
                0,
                this.t + n - t
              );
            r.clamp(), r.drShiftTo(1, r);
          }),
          (a.prototype.modInt = function (e) {
            if (e <= 0) return 0;
            var t = this.DV % e,
              r = this.s < 0 ? e - 1 : 0;
            if (this.t > 0) {
              if (0 == t) r = this.data[0] % e;
              else
                for (var n = this.t - 1; n >= 0; --n)
                  r = (t * r + this.data[n]) % e;
            }
            return r;
          }),
          (a.prototype.millerRabin = function (e) {
            var t = this.subtract(a.ONE),
              r = t.getLowestSetBit();
            if (r <= 0) return !1;
            for (
              var n,
                i = t.shiftRight(r),
                s = {
                  nextBytes: function (e) {
                    for (var t = 0; t < e.length; ++t)
                      e[t] = Math.floor(256 * Math.random());
                  },
                },
                o = 0;
              o < e;
              ++o
            ) {
              do n = new a(this.bitLength(), s);
              while (0 >= n.compareTo(a.ONE) || n.compareTo(t) >= 0);
              var c = n.modPow(i, this);
              if (0 != c.compareTo(a.ONE) && 0 != c.compareTo(t)) {
                for (var u = 1; u++ < r && 0 != c.compareTo(t); )
                  if (0 == (c = c.modPowInt(2, this)).compareTo(a.ONE))
                    return !1;
                if (0 != c.compareTo(t)) return !1;
              }
            }
            return !0;
          }),
          (a.prototype.clone = function () {
            var e = s();
            return this.copyTo(e), e;
          }),
          (a.prototype.intValue = function () {
            if (this.s < 0) {
              if (1 == this.t) return this.data[0] - this.DV;
              if (0 == this.t) return -1;
            } else {
              if (1 == this.t) return this.data[0];
              if (0 == this.t) return 0;
            }
            return (
              ((this.data[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) |
              this.data[0]
            );
          }),
          (a.prototype.byteValue = function () {
            return 0 == this.t ? this.s : (this.data[0] << 24) >> 24;
          }),
          (a.prototype.shortValue = function () {
            return 0 == this.t ? this.s : (this.data[0] << 16) >> 16;
          }),
          (a.prototype.signum = function () {
            return this.s < 0
              ? -1
              : this.t <= 0 || (1 == this.t && this.data[0] <= 0)
              ? 0
              : 1;
          }),
          (a.prototype.toByteArray = function () {
            var e = this.t,
              t = [];
            t[0] = this.s;
            var r,
              n = this.DB - ((e * this.DB) % 8),
              i = 0;
            if (e-- > 0)
              for (
                n < this.DB &&
                (r = this.data[e] >> n) != (this.s & this.DM) >> n &&
                (t[i++] = r | (this.s << (this.DB - n)));
                e >= 0;

              )
                n < 8
                  ? ((r = (this.data[e] & ((1 << n) - 1)) << (8 - n)),
                    (r |= this.data[--e] >> (n += this.DB - 8)))
                  : ((r = (this.data[e] >> (n -= 8)) & 255),
                    n <= 0 && ((n += this.DB), --e)),
                  0 != (128 & r) && (r |= -256),
                  0 == i && (128 & this.s) != (128 & r) && ++i,
                  (i > 0 || r != this.s) && (t[i++] = r);
            return t;
          }),
          (a.prototype.equals = function (e) {
            return 0 == this.compareTo(e);
          }),
          (a.prototype.min = function (e) {
            return 0 > this.compareTo(e) ? this : e;
          }),
          (a.prototype.max = function (e) {
            return this.compareTo(e) > 0 ? this : e;
          }),
          (a.prototype.and = function (e) {
            var t = s();
            return this.bitwiseTo(e, g, t), t;
          }),
          (a.prototype.or = function (e) {
            var t = s();
            return this.bitwiseTo(e, y, t), t;
          }),
          (a.prototype.xor = function (e) {
            var t = s();
            return this.bitwiseTo(e, m, t), t;
          }),
          (a.prototype.andNot = function (e) {
            var t = s();
            return this.bitwiseTo(e, v, t), t;
          }),
          (a.prototype.not = function () {
            for (var e = s(), t = 0; t < this.t; ++t)
              e.data[t] = this.DM & ~this.data[t];
            return (e.t = this.t), (e.s = ~this.s), e;
          }),
          (a.prototype.shiftLeft = function (e) {
            var t = s();
            return e < 0 ? this.rShiftTo(-e, t) : this.lShiftTo(e, t), t;
          }),
          (a.prototype.shiftRight = function (e) {
            var t = s();
            return e < 0 ? this.lShiftTo(-e, t) : this.rShiftTo(e, t), t;
          }),
          (a.prototype.getLowestSetBit = function () {
            for (var e = 0; e < this.t; ++e)
              if (0 != this.data[e]) return e * this.DB + C(this.data[e]);
            return this.s < 0 ? this.t * this.DB : -1;
          }),
          (a.prototype.bitCount = function () {
            for (var e = 0, t = this.s & this.DM, r = 0; r < this.t; ++r)
              e += E(this.data[r] ^ t);
            return e;
          }),
          (a.prototype.testBit = function (e) {
            var t = Math.floor(e / this.DB);
            return t >= this.t
              ? 0 != this.s
              : 0 != (this.data[t] & (1 << e % this.DB));
          }),
          (a.prototype.setBit = function (e) {
            return this.changeBit(e, y);
          }),
          (a.prototype.clearBit = function (e) {
            return this.changeBit(e, v);
          }),
          (a.prototype.flipBit = function (e) {
            return this.changeBit(e, m);
          }),
          (a.prototype.add = function (e) {
            var t = s();
            return this.addTo(e, t), t;
          }),
          (a.prototype.subtract = function (e) {
            var t = s();
            return this.subTo(e, t), t;
          }),
          (a.prototype.multiply = function (e) {
            var t = s();
            return this.multiplyTo(e, t), t;
          }),
          (a.prototype.divide = function (e) {
            var t = s();
            return this.divRemTo(e, t, null), t;
          }),
          (a.prototype.remainder = function (e) {
            var t = s();
            return this.divRemTo(e, null, t), t;
          }),
          (a.prototype.divideAndRemainder = function (e) {
            var t = s(),
              r = s();
            return this.divRemTo(e, t, r), [t, r];
          }),
          (a.prototype.modPow = function (e, t) {
            var r,
              n,
              i = e.bitLength(),
              a = f(1);
            if (i <= 0) return a;
            (r = i < 18 ? 1 : i < 48 ? 3 : i < 144 ? 4 : i < 768 ? 5 : 6),
              (n = i < 8 ? new d(t) : t.isEven() ? new T(t) : new $(t));
            var o = [],
              c = 3,
              u = r - 1,
              l = (1 << r) - 1;
            if (((o[1] = n.convert(this)), r > 1)) {
              var _ = s();
              for (n.sqrTo(o[1], _); c <= l; )
                (o[c] = s()), n.mulTo(_, o[c - 2], o[c]), (c += 2);
            }
            var p,
              g,
              y = e.t - 1,
              m = !0,
              v = s();
            for (i = h(e.data[y]) - 1; y >= 0; ) {
              for (
                i >= u
                  ? (p = (e.data[y] >> (i - u)) & l)
                  : ((p = (e.data[y] & ((1 << (i + 1)) - 1)) << (u - i)),
                    y > 0 && (p |= e.data[y - 1] >> (this.DB + i - u))),
                  c = r;
                0 == (1 & p);

              )
                (p >>= 1), --c;
              if (((i -= c) < 0 && ((i += this.DB), --y), m))
                o[p].copyTo(a), (m = !1);
              else {
                for (; c > 1; ) n.sqrTo(a, v), n.sqrTo(v, a), (c -= 2);
                c > 0 ? n.sqrTo(a, v) : ((g = a), (a = v), (v = g)),
                  n.mulTo(v, o[p], a);
              }
              for (; y >= 0 && 0 == (e.data[y] & (1 << i)); )
                n.sqrTo(a, v),
                  (g = a),
                  (a = v),
                  (v = g),
                  --i < 0 && ((i = this.DB - 1), --y);
            }
            return n.revert(a);
          }),
          (a.prototype.modInverse = function (e) {
            var t = e.isEven();
            if ((this.isEven() && t) || 0 == e.signum()) return a.ZERO;
            for (
              var r = e.clone(),
                n = this.clone(),
                i = f(1),
                s = f(0),
                o = f(0),
                c = f(1);
              0 != r.signum();

            ) {
              for (; r.isEven(); )
                r.rShiftTo(1, r),
                  t
                    ? ((i.isEven() && s.isEven()) ||
                        (i.addTo(this, i), s.subTo(e, s)),
                      i.rShiftTo(1, i))
                    : s.isEven() || s.subTo(e, s),
                  s.rShiftTo(1, s);
              for (; n.isEven(); )
                n.rShiftTo(1, n),
                  t
                    ? ((o.isEven() && c.isEven()) ||
                        (o.addTo(this, o), c.subTo(e, c)),
                      o.rShiftTo(1, o))
                    : c.isEven() || c.subTo(e, c),
                  c.rShiftTo(1, c);
              r.compareTo(n) >= 0
                ? (r.subTo(n, r), t && i.subTo(o, i), s.subTo(c, s))
                : (n.subTo(r, n), t && o.subTo(i, o), c.subTo(s, c));
            }
            return 0 != n.compareTo(a.ONE)
              ? a.ZERO
              : c.compareTo(e) >= 0
              ? c.subtract(e)
              : 0 > c.signum()
              ? (c.addTo(e, c), 0 > c.signum() ? c.add(e) : c)
              : c;
          }),
          (a.prototype.pow = function (e) {
            return this.exp(e, new S());
          }),
          (a.prototype.gcd = function (e) {
            var t = this.s < 0 ? this.negate() : this.clone(),
              r = e.s < 0 ? e.negate() : e.clone();
            if (0 > t.compareTo(r)) {
              var n = t;
              (t = r), (r = n);
            }
            var i = t.getLowestSetBit(),
              a = r.getLowestSetBit();
            if (a < 0) return t;
            for (
              i < a && (a = i), a > 0 && (t.rShiftTo(a, t), r.rShiftTo(a, r));
              t.signum() > 0;

            )
              (i = t.getLowestSetBit()) > 0 && t.rShiftTo(i, t),
                (i = r.getLowestSetBit()) > 0 && r.rShiftTo(i, r),
                t.compareTo(r) >= 0
                  ? (t.subTo(r, t), t.rShiftTo(1, t))
                  : (r.subTo(t, r), r.rShiftTo(1, r));
            return a > 0 && r.lShiftTo(a, r), r;
          }),
          (a.prototype.isProbablePrime = function (e) {
            var t,
              r = this.abs();
            if (1 == r.t && r.data[0] <= I[I.length - 1]) {
              for (t = 0; t < I.length; ++t) if (r.data[0] == I[t]) return !0;
              return !1;
            }
            if (r.isEven()) return !1;
            for (t = 1; t < I.length; ) {
              for (var n = I[t], i = t + 1; i < I.length && n < A; )
                n *= I[i++];
              for (n = r.modInt(n); t < i; ) if (n % I[t++] == 0) return !1;
            }
            return r.millerRabin(e);
          });
      },
      { "./forge": 16 },
    ],
    20: [
      function (e, t, r) {
        var n = e("./forge");
        e("./util"),
          e("./random"),
          e("./jsbn"),
          (t.exports = n.kem = n.kem || {});
        var i = n.jsbn.BigInteger;
        function a(e, t, r, i) {
          e.generate = function (e, a) {
            for (
              var s = new n.util.ByteBuffer(),
                o = Math.ceil(a / i) + r,
                c = new n.util.ByteBuffer(),
                u = r;
              u < o;
              ++u
            ) {
              c.putInt32(u), t.start(), t.update(e + c.getBytes());
              var l = t.digest();
              s.putBytes(l.getBytes(i));
            }
            return s.truncate(s.length() - a), s.getBytes();
          };
        }
        (n.kem.rsa = {}),
          (n.kem.rsa.create = function (e, t) {
            var r = (t = t || {}).prng || n.random;
            return {
              encrypt: function (t, a) {
                var s,
                  o = Math.ceil(t.n.bitLength() / 8);
                do s = new i(n.util.bytesToHex(r.getBytesSync(o)), 16).mod(t.n);
                while (0 >= s.compareTo(i.ONE));
                var c = o - (s = n.util.hexToBytes(s.toString(16))).length;
                return (
                  c > 0 && (s = n.util.fillString("\0", c) + s),
                  { encapsulation: t.encrypt(s, "NONE"), key: e.generate(s, a) }
                );
              },
              decrypt: function (t, r, n) {
                var i = t.decrypt(r, "NONE");
                return e.generate(i, n);
              },
            };
          }),
          (n.kem.kdf1 = function (e, t) {
            a(this, e, 0, t || e.digestLength);
          }),
          (n.kem.kdf2 = function (e, t) {
            a(this, e, 1, t || e.digestLength);
          });
      },
      { "./forge": 16, "./jsbn": 19, "./random": 39, "./util": 48 },
    ],
    21: [
      function (e, t, r) {
        var n,
          i = e("./forge");
        e("./util"),
          (t.exports = i.log = i.log || {}),
          (i.log.levels = [
            "none",
            "error",
            "warning",
            "info",
            "debug",
            "verbose",
            "max",
          ]);
        var a = {},
          s = [],
          o = null;
        (i.log.LEVEL_LOCKED = 2),
          (i.log.NO_LEVEL_CHECK = 4),
          (i.log.INTERPOLATE = 8);
        for (var c = 0; c < i.log.levels.length; ++c) {
          var u = i.log.levels[c];
          a[u] = { index: c, name: u.toUpperCase() };
        }
        (i.log.logMessage = function (e) {
          for (var t = a[e.level].index, r = 0; r < s.length; ++r) {
            var n = s[r];
            n.flags & i.log.NO_LEVEL_CHECK
              ? n.f(e)
              : t <= a[n.level].index && n.f(n, e);
          }
        }),
          (i.log.prepareStandard = function (e) {
            "standard" in e ||
              (e.standard =
                a[e.level].name + " [" + e.category + "] " + e.message);
          }),
          (i.log.prepareFull = function (e) {
            if (!("full" in e)) {
              var t = [e.message];
              (t = t.concat([])), (e.full = i.util.format.apply(this, t));
            }
          }),
          (i.log.prepareStandardFull = function (e) {
            "standardFull" in e ||
              (i.log.prepareStandard(e), (e.standardFull = e.standard));
          });
        var l = ["error", "warning", "info", "debug", "verbose"];
        for (c = 0; c < l.length; ++c)
          !(function (e) {
            i.log[e] = function (t, r) {
              var n = Array.prototype.slice.call(arguments).slice(2),
                a = {
                  timestamp: new Date(),
                  level: e,
                  category: t,
                  message: r,
                  arguments: n,
                };
              i.log.logMessage(a);
            };
          })(l[c]);
        if (
          ((i.log.makeLogger = function (e) {
            var t = { flags: 0, f: e };
            return i.log.setLevel(t, "none"), t;
          }),
          (i.log.setLevel = function (e, t) {
            var r = !1;
            if (e && !(e.flags & i.log.LEVEL_LOCKED)) {
              for (var n = 0; n < i.log.levels.length; ++n)
                if (t == i.log.levels[n]) {
                  (e.level = t), (r = !0);
                  break;
                }
            }
            return r;
          }),
          (i.log.lock = function (e, t) {
            void 0 === t || t
              ? (e.flags |= i.log.LEVEL_LOCKED)
              : (e.flags &= ~i.log.LEVEL_LOCKED);
          }),
          (i.log.addLogger = function (e) {
            s.push(e);
          }),
          "undefined" != typeof console && "log" in console)
        ) {
          if (console.error && console.warn && console.info && console.debug) {
            var _ = {
                error: console.error,
                warning: console.warn,
                info: console.info,
                debug: console.debug,
                verbose: console.debug,
              },
              p = function (e, t) {
                i.log.prepareStandard(t);
                var r = _[t.level],
                  n = [t.standard];
                (n = n.concat(t.arguments.slice())), r.apply(console, n);
              };
            n = i.log.makeLogger(p);
          } else
            (p = function (e, t) {
              i.log.prepareStandardFull(t), console.log(t.standardFull);
            }),
              (n = i.log.makeLogger(p));
          i.log.setLevel(n, "debug"), i.log.addLogger(n), (o = n);
        } else console = { log: function () {} };
        if (null !== o) {
          var f = i.util.getQueryVariables();
          "console.level" in f &&
            i.log.setLevel(o, f["console.level"].slice(-1)[0]),
            "console.lock" in f &&
              "true" == f["console.lock"].slice(-1)[0] &&
              i.log.lock(o);
        }
        i.log.consoleLogger = o;
      },
      { "./forge": 16, "./util": 48 },
    ],
    22: [
      function (e, t, r) {
        (t.exports = e("./md")),
          e("./md5"),
          e("./sha1"),
          e("./sha256"),
          e("./sha512");
      },
      { "./md": 23, "./md5": 24, "./sha1": 42, "./sha256": 43, "./sha512": 44 },
    ],
    23: [
      function (e, t, r) {
        var n = e("./forge");
        (t.exports = n.md = n.md || {}),
          (n.md.algorithms = n.md.algorithms || {});
      },
      { "./forge": 16 },
    ],
    24: [
      function (e, t, r) {
        var n = e("./forge");
        e("./md"), e("./util");
        var i = (t.exports = n.md5 = n.md5 || {});
        (n.md.md5 = n.md.algorithms.md5 = i),
          (i.create = function () {
            u ||
              (function () {
                (a = "\x80"),
                  (a += n.util.fillString("\0", 64)),
                  (s = [
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 1, 6,
                    11, 0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12, 5, 8, 11,
                    14, 1, 4, 7, 10, 13, 0, 3, 6, 9, 12, 15, 2, 0, 7, 14, 5, 12,
                    3, 10, 1, 8, 15, 6, 13, 4, 11, 2, 9,
                  ]),
                  (o = [
                    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
                    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4,
                    11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6,
                    10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
                  ]),
                  (c = Array(64));
                for (var e = 0; e < 64; ++e)
                  c[e] = Math.floor(4294967296 * Math.abs(Math.sin(e + 1)));
                u = !0;
              })();
            var e = null,
              t = n.util.createBuffer(),
              r = Array(16),
              i = {
                algorithm: "md5",
                blockLength: 64,
                digestLength: 16,
                messageLength: 0,
                fullMessageLength: null,
                messageLengthSize: 8,
                start: function () {
                  (i.messageLength = 0),
                    (i.fullMessageLength = i.messageLength64 = []);
                  for (var r = i.messageLengthSize / 4, a = 0; a < r; ++a)
                    i.fullMessageLength.push(0);
                  return (
                    (t = n.util.createBuffer()),
                    (e = {
                      h0: 1732584193,
                      h1: 4023233417,
                      h2: 2562383102,
                      h3: 271733878,
                    }),
                    i
                  );
                },
              };
            return (
              i.start(),
              (i.update = function (a, s) {
                "utf8" === s && (a = n.util.encodeUtf8(a));
                var o = a.length;
                (i.messageLength += o), (o = [(o / 4294967296) >>> 0, o >>> 0]);
                for (var c = i.fullMessageLength.length - 1; c >= 0; --c)
                  (i.fullMessageLength[c] += o[1]),
                    (o[1] =
                      o[0] + ((i.fullMessageLength[c] / 4294967296) >>> 0)),
                    (i.fullMessageLength[c] = i.fullMessageLength[c] >>> 0),
                    (o[0] = (o[1] / 4294967296) >>> 0);
                return (
                  t.putBytes(a),
                  l(e, r, t),
                  (t.read > 2048 || 0 === t.length()) && t.compact(),
                  i
                );
              }),
              (i.digest = function () {
                var s = n.util.createBuffer();
                s.putBytes(t.bytes());
                var o =
                  (i.fullMessageLength[i.fullMessageLength.length - 1] +
                    i.messageLengthSize) &
                  (i.blockLength - 1);
                s.putBytes(a.substr(0, i.blockLength - o));
                for (
                  var c, u = 0, _ = i.fullMessageLength.length - 1;
                  _ >= 0;
                  --_
                )
                  (u =
                    ((c = 8 * i.fullMessageLength[_] + u) / 4294967296) >>> 0),
                    s.putInt32Le(c >>> 0);
                var p = { h0: e.h0, h1: e.h1, h2: e.h2, h3: e.h3 };
                l(p, r, s);
                var f = n.util.createBuffer();
                return (
                  f.putInt32Le(p.h0),
                  f.putInt32Le(p.h1),
                  f.putInt32Le(p.h2),
                  f.putInt32Le(p.h3),
                  f
                );
              }),
              i
            );
          });
        var a = null,
          s = null,
          o = null,
          c = null,
          u = !1;
        function l(e, t, r) {
          for (var n, i, a, u, l, _, p, f = r.length(); f >= 64; ) {
            for (i = e.h0, a = e.h1, u = e.h2, l = e.h3, p = 0; p < 16; ++p)
              (t[p] = r.getInt32Le()),
                (n = i + (l ^ (a & (u ^ l))) + c[p] + t[p]),
                (i = l),
                (l = u),
                (u = a),
                (a += (n << (_ = o[p])) | (n >>> (32 - _)));
            for (; p < 32; ++p)
              (n = i + (u ^ (l & (a ^ u))) + c[p] + t[s[p]]),
                (i = l),
                (l = u),
                (u = a),
                (a += (n << (_ = o[p])) | (n >>> (32 - _)));
            for (; p < 48; ++p)
              (n = i + (a ^ u ^ l) + c[p] + t[s[p]]),
                (i = l),
                (l = u),
                (u = a),
                (a += (n << (_ = o[p])) | (n >>> (32 - _)));
            for (; p < 64; ++p)
              (n = i + (u ^ (a | ~l)) + c[p] + t[s[p]]),
                (i = l),
                (l = u),
                (u = a),
                (a += (n << (_ = o[p])) | (n >>> (32 - _)));
            (e.h0 = (e.h0 + i) | 0),
              (e.h1 = (e.h1 + a) | 0),
              (e.h2 = (e.h2 + u) | 0),
              (e.h3 = (e.h3 + l) | 0),
              (f -= 64);
          }
        }
      },
      { "./forge": 16, "./md": 23, "./util": 48 },
    ],
    25: [
      function (e, t, r) {
        var n = e("./forge");
        e("./mgf1"), (t.exports = n.mgf = n.mgf || {}), (n.mgf.mgf1 = n.mgf1);
      },
      { "./forge": 16, "./mgf1": 26 },
    ],
    26: [
      function (e, t, r) {
        var n = e("./forge");
        e("./util"),
          (n.mgf = n.mgf || {}),
          ((t.exports = n.mgf.mgf1 = n.mgf1 = n.mgf1 || {}).create = function (
            e
          ) {
            return {
              generate: function (t, r) {
                for (
                  var i = new n.util.ByteBuffer(),
                    a = Math.ceil(r / e.digestLength),
                    s = 0;
                  s < a;
                  s++
                ) {
                  var o = new n.util.ByteBuffer();
                  o.putInt32(s),
                    e.start(),
                    e.update(t + o.getBytes()),
                    i.putBuffer(e.digest());
                }
                return i.truncate(i.length() - r), i.getBytes();
              },
            };
          });
      },
      { "./forge": 16, "./util": 48 },
    ],
    27: [
      function (e, t, r) {
        var n = e("./forge");
        n.pki = n.pki || {};
        var i = (t.exports = n.pki.oids = n.oids = n.oids || {});
        function a(e, t) {
          (i[e] = t), (i[t] = e);
        }
        function s(e, t) {
          i[e] = t;
        }
        a("1.2.840.113549.1.1.1", "rsaEncryption"),
          a("1.2.840.113549.1.1.4", "md5WithRSAEncryption"),
          a("1.2.840.113549.1.1.5", "sha1WithRSAEncryption"),
          a("1.2.840.113549.1.1.7", "RSAES-OAEP"),
          a("1.2.840.113549.1.1.8", "mgf1"),
          a("1.2.840.113549.1.1.9", "pSpecified"),
          a("1.2.840.113549.1.1.10", "RSASSA-PSS"),
          a("1.2.840.113549.1.1.11", "sha256WithRSAEncryption"),
          a("1.2.840.113549.1.1.12", "sha384WithRSAEncryption"),
          a("1.2.840.113549.1.1.13", "sha512WithRSAEncryption"),
          a("1.2.840.10040.4.3", "dsa-with-sha1"),
          a("1.3.14.3.2.7", "desCBC"),
          a("1.3.14.3.2.26", "sha1"),
          a("2.16.840.1.101.3.4.2.1", "sha256"),
          a("2.16.840.1.101.3.4.2.2", "sha384"),
          a("2.16.840.1.101.3.4.2.3", "sha512"),
          a("1.2.840.113549.2.5", "md5"),
          a("1.2.840.113549.1.7.1", "data"),
          a("1.2.840.113549.1.7.2", "signedData"),
          a("1.2.840.113549.1.7.3", "envelopedData"),
          a("1.2.840.113549.1.7.4", "signedAndEnvelopedData"),
          a("1.2.840.113549.1.7.5", "digestedData"),
          a("1.2.840.113549.1.7.6", "encryptedData"),
          a("1.2.840.113549.1.9.1", "emailAddress"),
          a("1.2.840.113549.1.9.2", "unstructuredName"),
          a("1.2.840.113549.1.9.3", "contentType"),
          a("1.2.840.113549.1.9.4", "messageDigest"),
          a("1.2.840.113549.1.9.5", "signingTime"),
          a("1.2.840.113549.1.9.6", "counterSignature"),
          a("1.2.840.113549.1.9.7", "challengePassword"),
          a("1.2.840.113549.1.9.8", "unstructuredAddress"),
          a("1.2.840.113549.1.9.14", "extensionRequest"),
          a("1.2.840.113549.1.9.20", "friendlyName"),
          a("1.2.840.113549.1.9.21", "localKeyId"),
          a("1.2.840.113549.1.9.22.1", "x509Certificate"),
          a("1.2.840.113549.1.12.10.1.1", "keyBag"),
          a("1.2.840.113549.1.12.10.1.2", "pkcs8ShroudedKeyBag"),
          a("1.2.840.113549.1.12.10.1.3", "certBag"),
          a("1.2.840.113549.1.12.10.1.4", "crlBag"),
          a("1.2.840.113549.1.12.10.1.5", "secretBag"),
          a("1.2.840.113549.1.12.10.1.6", "safeContentsBag"),
          a("1.2.840.113549.1.5.13", "pkcs5PBES2"),
          a("1.2.840.113549.1.5.12", "pkcs5PBKDF2"),
          a("1.2.840.113549.1.12.1.1", "pbeWithSHAAnd128BitRC4"),
          a("1.2.840.113549.1.12.1.2", "pbeWithSHAAnd40BitRC4"),
          a("1.2.840.113549.1.12.1.3", "pbeWithSHAAnd3-KeyTripleDES-CBC"),
          a("1.2.840.113549.1.12.1.4", "pbeWithSHAAnd2-KeyTripleDES-CBC"),
          a("1.2.840.113549.1.12.1.5", "pbeWithSHAAnd128BitRC2-CBC"),
          a("1.2.840.113549.1.12.1.6", "pbewithSHAAnd40BitRC2-CBC"),
          a("1.2.840.113549.2.7", "hmacWithSHA1"),
          a("1.2.840.113549.2.8", "hmacWithSHA224"),
          a("1.2.840.113549.2.9", "hmacWithSHA256"),
          a("1.2.840.113549.2.10", "hmacWithSHA384"),
          a("1.2.840.113549.2.11", "hmacWithSHA512"),
          a("1.2.840.113549.3.7", "des-EDE3-CBC"),
          a("2.16.840.1.101.3.4.1.2", "aes128-CBC"),
          a("2.16.840.1.101.3.4.1.22", "aes192-CBC"),
          a("2.16.840.1.101.3.4.1.42", "aes256-CBC"),
          a("2.5.4.3", "commonName"),
          a("2.5.4.5", "serialName"),
          a("2.5.4.6", "countryName"),
          a("2.5.4.7", "localityName"),
          a("2.5.4.8", "stateOrProvinceName"),
          a("2.5.4.10", "organizationName"),
          a("2.5.4.11", "organizationalUnitName"),
          a("2.5.4.13", "description"),
          a("2.16.840.1.113730.1.1", "nsCertType"),
          a("2.16.840.1.113730.1.13", "nsComment"),
          (i["2.5.29.1"] = "authorityKeyIdentifier"),
          (i["2.5.29.2"] = "keyAttributes"),
          (i["2.5.29.3"] = "certificatePolicies"),
          (i["2.5.29.4"] = "keyUsageRestriction"),
          (i["2.5.29.5"] = "policyMapping"),
          (i["2.5.29.6"] = "subtreesConstraint"),
          (i["2.5.29.7"] = "subjectAltName"),
          (i["2.5.29.8"] = "issuerAltName"),
          (i["2.5.29.9"] = "subjectDirectoryAttributes"),
          (i["2.5.29.10"] = "basicConstraints"),
          (i["2.5.29.11"] = "nameConstraints"),
          (i["2.5.29.12"] = "policyConstraints"),
          (i["2.5.29.13"] = "basicConstraints"),
          a("2.5.29.14", "subjectKeyIdentifier"),
          a("2.5.29.15", "keyUsage"),
          (i["2.5.29.16"] = "privateKeyUsagePeriod"),
          a("2.5.29.17", "subjectAltName"),
          a("2.5.29.18", "issuerAltName"),
          a("2.5.29.19", "basicConstraints"),
          (i["2.5.29.20"] = "cRLNumber"),
          (i["2.5.29.21"] = "cRLReason"),
          (i["2.5.29.22"] = "expirationDate"),
          (i["2.5.29.23"] = "instructionCode"),
          (i["2.5.29.24"] = "invalidityDate"),
          (i["2.5.29.25"] = "cRLDistributionPoints"),
          (i["2.5.29.26"] = "issuingDistributionPoint"),
          (i["2.5.29.27"] = "deltaCRLIndicator"),
          (i["2.5.29.28"] = "issuingDistributionPoint"),
          (i["2.5.29.29"] = "certificateIssuer"),
          (i["2.5.29.30"] = "nameConstraints"),
          a("2.5.29.31", "cRLDistributionPoints"),
          a("2.5.29.32", "certificatePolicies"),
          (i["2.5.29.33"] = "policyMappings"),
          (i["2.5.29.34"] = "policyConstraints"),
          a("2.5.29.35", "authorityKeyIdentifier"),
          (i["2.5.29.36"] = "policyConstraints"),
          a("2.5.29.37", "extKeyUsage"),
          (i["2.5.29.46"] = "freshestCRL"),
          (i["2.5.29.54"] = "inhibitAnyPolicy"),
          a("1.3.6.1.4.1.11129.2.4.2", "timestampList"),
          a("1.3.6.1.5.5.7.1.1", "authorityInfoAccess"),
          a("1.3.6.1.5.5.7.3.1", "serverAuth"),
          a("1.3.6.1.5.5.7.3.2", "clientAuth"),
          a("1.3.6.1.5.5.7.3.3", "codeSigning"),
          a("1.3.6.1.5.5.7.3.4", "emailProtection"),
          a("1.3.6.1.5.5.7.3.8", "timeStamping");
      },
      { "./forge": 16 },
    ],
    28: [
      function (e, t, r) {
        var n = e("./forge");
        if (
          (e("./aes"),
          e("./asn1"),
          e("./des"),
          e("./md"),
          e("./oids"),
          e("./pbkdf2"),
          e("./pem"),
          e("./random"),
          e("./rc2"),
          e("./rsa"),
          e("./util"),
          void 0 === i)
        )
          var i = n.jsbn.BigInteger;
        var a = n.asn1,
          s = (n.pki = n.pki || {});
        t.exports = s.pbe = n.pbe = n.pbe || {};
        var o = s.oids,
          c = {
            name: "EncryptedPrivateKeyInfo",
            tagClass: a.Class.UNIVERSAL,
            type: a.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "EncryptedPrivateKeyInfo.encryptionAlgorithm",
                tagClass: a.Class.UNIVERSAL,
                type: a.Type.SEQUENCE,
                constructed: !0,
                value: [
                  {
                    name: "AlgorithmIdentifier.algorithm",
                    tagClass: a.Class.UNIVERSAL,
                    type: a.Type.OID,
                    constructed: !1,
                    capture: "encryptionOid",
                  },
                  {
                    name: "AlgorithmIdentifier.parameters",
                    tagClass: a.Class.UNIVERSAL,
                    type: a.Type.SEQUENCE,
                    constructed: !0,
                    captureAsn1: "encryptionParams",
                  },
                ],
              },
              {
                name: "EncryptedPrivateKeyInfo.encryptedData",
                tagClass: a.Class.UNIVERSAL,
                type: a.Type.OCTETSTRING,
                constructed: !1,
                capture: "encryptedData",
              },
            ],
          },
          u = {
            name: "PBES2Algorithms",
            tagClass: a.Class.UNIVERSAL,
            type: a.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "PBES2Algorithms.keyDerivationFunc",
                tagClass: a.Class.UNIVERSAL,
                type: a.Type.SEQUENCE,
                constructed: !0,
                value: [
                  {
                    name: "PBES2Algorithms.keyDerivationFunc.oid",
                    tagClass: a.Class.UNIVERSAL,
                    type: a.Type.OID,
                    constructed: !1,
                    capture: "kdfOid",
                  },
                  {
                    name: "PBES2Algorithms.params",
                    tagClass: a.Class.UNIVERSAL,
                    type: a.Type.SEQUENCE,
                    constructed: !0,
                    value: [
                      {
                        name: "PBES2Algorithms.params.salt",
                        tagClass: a.Class.UNIVERSAL,
                        type: a.Type.OCTETSTRING,
                        constructed: !1,
                        capture: "kdfSalt",
                      },
                      {
                        name: "PBES2Algorithms.params.iterationCount",
                        tagClass: a.Class.UNIVERSAL,
                        type: a.Type.INTEGER,
                        constructed: !1,
                        capture: "kdfIterationCount",
                      },
                      {
                        name: "PBES2Algorithms.params.keyLength",
                        tagClass: a.Class.UNIVERSAL,
                        type: a.Type.INTEGER,
                        constructed: !1,
                        optional: !0,
                        capture: "keyLength",
                      },
                      {
                        name: "PBES2Algorithms.params.prf",
                        tagClass: a.Class.UNIVERSAL,
                        type: a.Type.SEQUENCE,
                        constructed: !0,
                        optional: !0,
                        value: [
                          {
                            name: "PBES2Algorithms.params.prf.algorithm",
                            tagClass: a.Class.UNIVERSAL,
                            type: a.Type.OID,
                            constructed: !1,
                            capture: "prfOid",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                name: "PBES2Algorithms.encryptionScheme",
                tagClass: a.Class.UNIVERSAL,
                type: a.Type.SEQUENCE,
                constructed: !0,
                value: [
                  {
                    name: "PBES2Algorithms.encryptionScheme.oid",
                    tagClass: a.Class.UNIVERSAL,
                    type: a.Type.OID,
                    constructed: !1,
                    capture: "encOid",
                  },
                  {
                    name: "PBES2Algorithms.encryptionScheme.iv",
                    tagClass: a.Class.UNIVERSAL,
                    type: a.Type.OCTETSTRING,
                    constructed: !1,
                    capture: "encIv",
                  },
                ],
              },
            ],
          },
          l = {
            name: "pkcs-12PbeParams",
            tagClass: a.Class.UNIVERSAL,
            type: a.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "pkcs-12PbeParams.salt",
                tagClass: a.Class.UNIVERSAL,
                type: a.Type.OCTETSTRING,
                constructed: !1,
                capture: "salt",
              },
              {
                name: "pkcs-12PbeParams.iterations",
                tagClass: a.Class.UNIVERSAL,
                type: a.Type.INTEGER,
                constructed: !1,
                capture: "iterations",
              },
            ],
          };
        function _(e, t) {
          return e.start().update(t).digest().getBytes();
        }
        function p(e) {
          var t;
          if (e) {
            if (!(t = s.oids[a.derToOid(e)])) {
              var r = Error("Unsupported PRF OID.");
              throw (
                ((r.oid = e),
                (r.supported = [
                  "hmacWithSHA1",
                  "hmacWithSHA224",
                  "hmacWithSHA256",
                  "hmacWithSHA384",
                  "hmacWithSHA512",
                ]),
                r)
              );
            }
          } else t = "hmacWithSHA1";
          return f(t);
        }
        function f(e) {
          var t = n.md;
          switch (e) {
            case "hmacWithSHA224":
              t = n.md.sha512;
            case "hmacWithSHA1":
            case "hmacWithSHA256":
            case "hmacWithSHA384":
            case "hmacWithSHA512":
              e = e.substr(8).toLowerCase();
              break;
            default:
              var r = Error("Unsupported PRF algorithm.");
              throw (
                ((r.algorithm = e),
                (r.supported = [
                  "hmacWithSHA1",
                  "hmacWithSHA224",
                  "hmacWithSHA256",
                  "hmacWithSHA384",
                  "hmacWithSHA512",
                ]),
                r)
              );
          }
          if (!(t && e in t)) throw Error("Unknown hash algorithm: " + e);
          return t[e].create();
        }
        (s.encryptPrivateKeyInfo = function (e, t, r) {
          ((r = r || {}).saltSize = r.saltSize || 8),
            (r.count = r.count || 2048),
            (r.algorithm = r.algorithm || "aes128"),
            (r.prfAlgorithm = r.prfAlgorithm || "sha1");
          var i,
            c,
            u,
            l = n.random.getBytesSync(r.saltSize),
            _ = r.count,
            p = a.integerToDer(_);
          if (0 === r.algorithm.indexOf("aes") || "des" === r.algorithm) {
            switch (r.algorithm) {
              case "aes128":
                (i = 16),
                  (h = 16),
                  (d = o["aes128-CBC"]),
                  ($ = n.aes.createEncryptionCipher);
                break;
              case "aes192":
                (i = 24),
                  (h = 16),
                  (d = o["aes192-CBC"]),
                  ($ = n.aes.createEncryptionCipher);
                break;
              case "aes256":
                (i = 32),
                  (h = 16),
                  (d = o["aes256-CBC"]),
                  ($ = n.aes.createEncryptionCipher);
                break;
              case "des":
                (i = 8),
                  (h = 8),
                  (d = o.desCBC),
                  ($ = n.des.createEncryptionCipher);
                break;
              default:
                throw (
                  (((A = Error(
                    "Cannot encrypt private key. Unknown encryption algorithm."
                  )).algorithm = r.algorithm),
                  A)
                );
            }
            var h,
              d,
              $,
              g,
              y,
              m,
              v,
              C,
              E = "hmacWith" + r.prfAlgorithm.toUpperCase(),
              S = f(E),
              b = n.pkcs5.pbkdf2(t, l, _, i, S),
              T = n.random.getBytesSync(h);
            (B = $(b)).start(T),
              B.update(a.toDer(e)),
              B.finish(),
              (u = B.output.getBytes());
            var I =
              ((g = l),
              (y = p),
              (m = i),
              (v = E),
              (C = a.create(a.Class.UNIVERSAL, a.Type.SEQUENCE, !0, [
                a.create(a.Class.UNIVERSAL, a.Type.OCTETSTRING, !1, g),
                a.create(a.Class.UNIVERSAL, a.Type.INTEGER, !1, y.getBytes()),
              ])),
              "hmacWithSHA1" !== v &&
                C.value.push(
                  a.create(
                    a.Class.UNIVERSAL,
                    a.Type.INTEGER,
                    !1,
                    n.util.hexToBytes(m.toString(16))
                  ),
                  a.create(a.Class.UNIVERSAL, a.Type.SEQUENCE, !0, [
                    a.create(
                      a.Class.UNIVERSAL,
                      a.Type.OID,
                      !1,
                      a.oidToDer(s.oids[v]).getBytes()
                    ),
                    a.create(a.Class.UNIVERSAL, a.Type.NULL, !1, ""),
                  ])
                ),
              C);
            c = a.create(a.Class.UNIVERSAL, a.Type.SEQUENCE, !0, [
              a.create(
                a.Class.UNIVERSAL,
                a.Type.OID,
                !1,
                a.oidToDer(o.pkcs5PBES2).getBytes()
              ),
              a.create(a.Class.UNIVERSAL, a.Type.SEQUENCE, !0, [
                a.create(a.Class.UNIVERSAL, a.Type.SEQUENCE, !0, [
                  a.create(
                    a.Class.UNIVERSAL,
                    a.Type.OID,
                    !1,
                    a.oidToDer(o.pkcs5PBKDF2).getBytes()
                  ),
                  I,
                ]),
                a.create(a.Class.UNIVERSAL, a.Type.SEQUENCE, !0, [
                  a.create(
                    a.Class.UNIVERSAL,
                    a.Type.OID,
                    !1,
                    a.oidToDer(d).getBytes()
                  ),
                  a.create(a.Class.UNIVERSAL, a.Type.OCTETSTRING, !1, T),
                ]),
              ]),
            ]);
          } else {
            if ("3des" !== r.algorithm)
              throw (
                (((A = Error(
                  "Cannot encrypt private key. Unknown encryption algorithm."
                )).algorithm = r.algorithm),
                A)
              );
            i = 24;
            var A,
              B,
              k = new n.util.ByteBuffer(l);
            (b = s.pbe.generatePkcs12Key(t, k, 1, _, i)),
              (T = s.pbe.generatePkcs12Key(t, k, 2, _, i)),
              (B = n.des.createEncryptionCipher(b)).start(T),
              B.update(a.toDer(e)),
              B.finish(),
              (u = B.output.getBytes()),
              (c = a.create(a.Class.UNIVERSAL, a.Type.SEQUENCE, !0, [
                a.create(
                  a.Class.UNIVERSAL,
                  a.Type.OID,
                  !1,
                  a.oidToDer(o["pbeWithSHAAnd3-KeyTripleDES-CBC"]).getBytes()
                ),
                a.create(a.Class.UNIVERSAL, a.Type.SEQUENCE, !0, [
                  a.create(a.Class.UNIVERSAL, a.Type.OCTETSTRING, !1, l),
                  a.create(a.Class.UNIVERSAL, a.Type.INTEGER, !1, p.getBytes()),
                ]),
              ]));
          }
          return a.create(a.Class.UNIVERSAL, a.Type.SEQUENCE, !0, [
            c,
            a.create(a.Class.UNIVERSAL, a.Type.OCTETSTRING, !1, u),
          ]);
        }),
          (s.decryptPrivateKeyInfo = function (e, t) {
            var r = null,
              i = {},
              o = [];
            if (!a.validate(e, c, i, o)) {
              var u = Error(
                "Cannot read encrypted private key. ASN.1 object is not a supported EncryptedPrivateKeyInfo."
              );
              throw ((u.errors = o), u);
            }
            var l = a.derToOid(i.encryptionOid),
              _ = s.pbe.getCipher(l, i.encryptionParams, t),
              p = n.util.createBuffer(i.encryptedData);
            return _.update(p), _.finish() && (r = a.fromDer(_.output)), r;
          }),
          (s.encryptedPrivateKeyToPem = function (e, t) {
            var r = {
              type: "ENCRYPTED PRIVATE KEY",
              body: a.toDer(e).getBytes(),
            };
            return n.pem.encode(r, { maxline: t });
          }),
          (s.encryptedPrivateKeyFromPem = function (e) {
            var t = n.pem.decode(e)[0];
            if ("ENCRYPTED PRIVATE KEY" !== t.type) {
              var r = Error(
                'Could not convert encrypted private key from PEM; PEM header type is "ENCRYPTED PRIVATE KEY".'
              );
              throw ((r.headerType = t.type), r);
            }
            if (t.procType && "ENCRYPTED" === t.procType.type)
              throw Error(
                "Could not convert encrypted private key from PEM; PEM is encrypted."
              );
            return a.fromDer(t.body);
          }),
          (s.encryptRsaPrivateKey = function (e, t, r) {
            if (!(r = r || {}).legacy) {
              var i,
                o,
                c,
                u,
                l = s.wrapRsaPrivateKey(s.privateKeyToAsn1(e));
              return (
                (l = s.encryptPrivateKeyInfo(l, t, r)),
                s.encryptedPrivateKeyToPem(l)
              );
            }
            switch (r.algorithm) {
              case "aes128":
                (i = "AES-128-CBC"),
                  (c = 16),
                  (o = n.random.getBytesSync(16)),
                  (u = n.aes.createEncryptionCipher);
                break;
              case "aes192":
                (i = "AES-192-CBC"),
                  (c = 24),
                  (o = n.random.getBytesSync(16)),
                  (u = n.aes.createEncryptionCipher);
                break;
              case "aes256":
                (i = "AES-256-CBC"),
                  (c = 32),
                  (o = n.random.getBytesSync(16)),
                  (u = n.aes.createEncryptionCipher);
                break;
              case "3des":
                (i = "DES-EDE3-CBC"),
                  (c = 24),
                  (o = n.random.getBytesSync(8)),
                  (u = n.des.createEncryptionCipher);
                break;
              case "des":
                (i = "DES-CBC"),
                  (c = 8),
                  (o = n.random.getBytesSync(8)),
                  (u = n.des.createEncryptionCipher);
                break;
              default:
                var _ = Error(
                  'Could not encrypt RSA private key; unsupported encryption algorithm "' +
                    r.algorithm +
                    '".'
                );
                throw ((_.algorithm = r.algorithm), _);
            }
            var p = u(n.pbe.opensslDeriveBytes(t, o.substr(0, 8), c));
            p.start(o), p.update(a.toDer(s.privateKeyToAsn1(e))), p.finish();
            var f = {
              type: "RSA PRIVATE KEY",
              procType: { version: "4", type: "ENCRYPTED" },
              dekInfo: {
                algorithm: i,
                parameters: n.util.bytesToHex(o).toUpperCase(),
              },
              body: p.output.getBytes(),
            };
            return n.pem.encode(f);
          }),
          (s.decryptRsaPrivateKey = function (e, t) {
            var r = null,
              i = n.pem.decode(e)[0];
            if (
              "ENCRYPTED PRIVATE KEY" !== i.type &&
              "PRIVATE KEY" !== i.type &&
              "RSA PRIVATE KEY" !== i.type
            )
              throw (
                (((u = Error(
                  'Could not convert private key from PEM; PEM header type is not "ENCRYPTED PRIVATE KEY", "PRIVATE KEY", or "RSA PRIVATE KEY".'
                )).headerType = u),
                u)
              );
            if (i.procType && "ENCRYPTED" === i.procType.type) {
              switch (i.dekInfo.algorithm) {
                case "DES-CBC":
                  (o = 8), (c = n.des.createDecryptionCipher);
                  break;
                case "DES-EDE3-CBC":
                  (o = 24), (c = n.des.createDecryptionCipher);
                  break;
                case "AES-128-CBC":
                  (o = 16), (c = n.aes.createDecryptionCipher);
                  break;
                case "AES-192-CBC":
                  (o = 24), (c = n.aes.createDecryptionCipher);
                  break;
                case "AES-256-CBC":
                  (o = 32), (c = n.aes.createDecryptionCipher);
                  break;
                case "RC2-40-CBC":
                  (o = 5),
                    (c = function (e) {
                      return n.rc2.createDecryptionCipher(e, 40);
                    });
                  break;
                case "RC2-64-CBC":
                  (o = 8),
                    (c = function (e) {
                      return n.rc2.createDecryptionCipher(e, 64);
                    });
                  break;
                case "RC2-128-CBC":
                  (o = 16),
                    (c = function (e) {
                      return n.rc2.createDecryptionCipher(e, 128);
                    });
                  break;
                default:
                  throw (
                    (((u = Error(
                      'Could not decrypt private key; unsupported encryption algorithm "' +
                        i.dekInfo.algorithm +
                        '".'
                    )).algorithm = i.dekInfo.algorithm),
                    u)
                  );
              }
              var o,
                c,
                u,
                l = n.util.hexToBytes(i.dekInfo.parameters),
                _ = c(n.pbe.opensslDeriveBytes(t, l.substr(0, 8), o));
              if (
                (_.start(l), _.update(n.util.createBuffer(i.body)), !_.finish())
              )
                return r;
              r = _.output.getBytes();
            } else r = i.body;
            return (
              null !==
                (r =
                  "ENCRYPTED PRIVATE KEY" === i.type
                    ? s.decryptPrivateKeyInfo(a.fromDer(r), t)
                    : a.fromDer(r)) && (r = s.privateKeyFromAsn1(r)),
              r
            );
          }),
          (s.pbe.generatePkcs12Key = function (e, t, r, i, a, s) {
            if (null == s) {
              if (!("sha1" in n.md))
                throw Error('"sha1" hash algorithm unavailable.');
              s = n.md.sha1.create();
            }
            var o,
              c,
              u = s.digestLength,
              l = s.blockLength,
              _ = new n.util.ByteBuffer(),
              p = new n.util.ByteBuffer();
            if (null != e) {
              for (c = 0; c < e.length; c++) p.putInt16(e.charCodeAt(c));
              p.putInt16(0);
            }
            var f = p.length(),
              h = t.length(),
              d = new n.util.ByteBuffer();
            d.fillWithByte(r, l);
            var $ = l * Math.ceil(h / l),
              g = new n.util.ByteBuffer();
            for (c = 0; c < $; c++) g.putByte(t.at(c % h));
            var y = l * Math.ceil(f / l),
              m = new n.util.ByteBuffer();
            for (c = 0; c < y; c++) m.putByte(p.at(c % f));
            var v = g;
            v.putBuffer(m);
            for (var C = Math.ceil(a / u), E = 1; E <= C; E++) {
              var S = new n.util.ByteBuffer();
              S.putBytes(d.bytes()), S.putBytes(v.bytes());
              for (var b = 0; b < i; b++)
                s.start(), s.update(S.getBytes()), (S = s.digest());
              var T = new n.util.ByteBuffer();
              for (c = 0; c < l; c++) T.putByte(S.at(c % u));
              var I = Math.ceil(h / l) + Math.ceil(f / l),
                A = new n.util.ByteBuffer();
              for (o = 0; o < I; o++) {
                var B = new n.util.ByteBuffer(v.getBytes(l)),
                  k = 511;
                for (c = T.length() - 1; c >= 0; c--)
                  (k >>= 8), (k += T.at(c) + B.at(c)), B.setAt(c, 255 & k);
                A.putBuffer(B);
              }
              (v = A), _.putBuffer(S);
            }
            return _.truncate(_.length() - a), _;
          }),
          (s.pbe.getCipher = function (e, t, r) {
            switch (e) {
              case s.oids.pkcs5PBES2:
                return s.pbe.getCipherForPBES2(e, t, r);
              case s.oids["pbeWithSHAAnd3-KeyTripleDES-CBC"]:
              case s.oids["pbewithSHAAnd40BitRC2-CBC"]:
                return s.pbe.getCipherForPKCS12PBE(e, t, r);
              default:
                var n = Error(
                  "Cannot read encrypted PBE data block. Unsupported OID."
                );
                throw (
                  ((n.oid = e),
                  (n.supportedOids = [
                    "pkcs5PBES2",
                    "pbeWithSHAAnd3-KeyTripleDES-CBC",
                    "pbewithSHAAnd40BitRC2-CBC",
                  ]),
                  n)
                );
            }
          }),
          (s.pbe.getCipherForPBES2 = function (e, t, r) {
            var i,
              o = {},
              c = [];
            if (!a.validate(t, u, o, c))
              throw (
                (((i = Error(
                  "Cannot read password-based-encryption algorithm parameters. ASN.1 object is not a supported EncryptedPrivateKeyInfo."
                )).errors = c),
                i)
              );
            if ((e = a.derToOid(o.kdfOid)) !== s.oids.pkcs5PBKDF2)
              throw (
                (((i = Error(
                  "Cannot read encrypted private key. Unsupported key derivation function OID."
                )).oid = e),
                (i.supportedOids = ["pkcs5PBKDF2"]),
                i)
              );
            if (
              (e = a.derToOid(o.encOid)) !== s.oids["aes128-CBC"] &&
              e !== s.oids["aes192-CBC"] &&
              e !== s.oids["aes256-CBC"] &&
              e !== s.oids["des-EDE3-CBC"] &&
              e !== s.oids.desCBC
            )
              throw (
                (((i = Error(
                  "Cannot read encrypted private key. Unsupported encryption scheme OID."
                )).oid = e),
                (i.supportedOids = [
                  "aes128-CBC",
                  "aes192-CBC",
                  "aes256-CBC",
                  "des-EDE3-CBC",
                  "desCBC",
                ]),
                i)
              );
            var l,
              _,
              f = o.kdfSalt,
              h = n.util.createBuffer(o.kdfIterationCount);
            switch (((h = h.getInt(h.length() << 3)), s.oids[e])) {
              case "aes128-CBC":
                (l = 16), (_ = n.aes.createDecryptionCipher);
                break;
              case "aes192-CBC":
                (l = 24), (_ = n.aes.createDecryptionCipher);
                break;
              case "aes256-CBC":
                (l = 32), (_ = n.aes.createDecryptionCipher);
                break;
              case "des-EDE3-CBC":
                (l = 24), (_ = n.des.createDecryptionCipher);
                break;
              case "desCBC":
                (l = 8), (_ = n.des.createDecryptionCipher);
            }
            var d = p(o.prfOid),
              $ = n.pkcs5.pbkdf2(r, f, h, l, d),
              g = o.encIv,
              y = _($);
            return y.start(g), y;
          }),
          (s.pbe.getCipherForPKCS12PBE = function (e, t, r) {
            var i,
              o = {},
              c = [];
            if (!a.validate(t, l, o, c))
              throw (
                (((i = Error(
                  "Cannot read password-based-encryption algorithm parameters. ASN.1 object is not a supported EncryptedPrivateKeyInfo."
                )).errors = c),
                i)
              );
            var u,
              _,
              f,
              h = n.util.createBuffer(o.salt),
              d = n.util.createBuffer(o.iterations);
            switch (((d = d.getInt(d.length() << 3)), e)) {
              case s.oids["pbeWithSHAAnd3-KeyTripleDES-CBC"]:
                (u = 24), (_ = 8), (f = n.des.startDecrypting);
                break;
              case s.oids["pbewithSHAAnd40BitRC2-CBC"]:
                (u = 5),
                  (_ = 8),
                  (f = function (e, t) {
                    var r = n.rc2.createDecryptionCipher(e, 40);
                    return r.start(t, null), r;
                  });
                break;
              default:
                throw (
                  (((i = Error(
                    "Cannot read PKCS #12 PBE data block. Unsupported OID."
                  )).oid = e),
                  i)
                );
            }
            var $ = p(o.prfOid),
              g = s.pbe.generatePkcs12Key(r, h, 1, d, u, $);
            return $.start(), f(g, s.pbe.generatePkcs12Key(r, h, 2, d, _, $));
          }),
          (s.pbe.opensslDeriveBytes = function (e, t, r, i) {
            if (null == i) {
              if (!("md5" in n.md))
                throw Error('"md5" hash algorithm unavailable.');
              i = n.md.md5.create();
            }
            null === t && (t = "");
            for (var a = [_(i, e + t)], s = 16, o = 1; s < r; ++o, s += 16)
              a.push(_(i, a[o - 1] + e + t));
            return a.join("").substr(0, r);
          });
      },
      {
        "./aes": 7,
        "./asn1": 9,
        "./des": 14,
        "./forge": 16,
        "./md": 23,
        "./oids": 27,
        "./pbkdf2": 29,
        "./pem": 30,
        "./random": 39,
        "./rc2": 40,
        "./rsa": 41,
        "./util": 48,
      },
    ],
    29: [
      function (e, t, r) {
        (function (r) {
          var n = e("./forge");
          e("./hmac"), e("./md"), e("./util");
          var i,
            a = (n.pkcs5 = n.pkcs5 || {});
          n.util.isNodejs && !n.options.usePureJavaScript && (i = e("crypto")),
            (t.exports =
              n.pbkdf2 =
              a.pbkdf2 =
                function (e, t, a, s, o, c) {
                  if (
                    ("function" == typeof o && ((c = o), (o = null)),
                    n.util.isNodejs &&
                      !n.options.usePureJavaScript &&
                      i.pbkdf2 &&
                      (null === o || "object" != typeof o) &&
                      (i.pbkdf2Sync.length > 4 || !o || "sha1" === o))
                  )
                    return (
                      "string" != typeof o && (o = "sha1"),
                      (e = r.from(e, "binary")),
                      (t = r.from(t, "binary")),
                      c
                        ? 4 === i.pbkdf2Sync.length
                          ? i.pbkdf2(e, t, a, s, function (e, t) {
                              if (e) return c(e);
                              c(null, t.toString("binary"));
                            })
                          : i.pbkdf2(e, t, a, s, o, function (e, t) {
                              if (e) return c(e);
                              c(null, t.toString("binary"));
                            })
                        : 4 === i.pbkdf2Sync.length
                        ? i.pbkdf2Sync(e, t, a, s).toString("binary")
                        : i.pbkdf2Sync(e, t, a, s, o).toString("binary")
                    );
                  if ((null == o && (o = "sha1"), "string" == typeof o)) {
                    if (!(o in n.md.algorithms))
                      throw Error("Unknown hash algorithm: " + o);
                    o = n.md[o].create();
                  }
                  var u = o.digestLength;
                  if (s > 4294967295 * u) {
                    var l = Error("Derived key is too long.");
                    if (c) return c(l);
                    throw l;
                  }
                  var _ = Math.ceil(s / u),
                    p = s - (_ - 1) * u,
                    f = n.hmac.create();
                  f.start(o, e);
                  var h,
                    d,
                    $,
                    g = "";
                  if (!c) {
                    for (var y = 1; y <= _; ++y) {
                      f.start(null, null),
                        f.update(t),
                        f.update(n.util.int32ToBytes(y)),
                        (h = $ = f.digest().getBytes());
                      for (var m = 2; m <= a; ++m)
                        f.start(null, null),
                          f.update($),
                          (d = f.digest().getBytes()),
                          (h = n.util.xorBytes(h, d, u)),
                          ($ = d);
                      g += y < _ ? h : h.substr(0, p);
                    }
                    return g;
                  }
                  (y = 1),
                    (function e() {
                      if (y > _) return c(null, g);
                      f.start(null, null),
                        f.update(t),
                        f.update(n.util.int32ToBytes(y)),
                        (h = $ = f.digest().getBytes()),
                        (m = 2),
                        (function t() {
                          if (m <= a)
                            return (
                              f.start(null, null),
                              f.update($),
                              (d = f.digest().getBytes()),
                              (h = n.util.xorBytes(h, d, u)),
                              ($ = d),
                              ++m,
                              n.util.setImmediate(t)
                            );
                          (g += y < _ ? h : h.substr(0, p)), ++y, e();
                        })();
                    })();
                });
        }).call(this, e("buffer").Buffer);
      },
      {
        "./forge": 16,
        "./hmac": 17,
        "./md": 23,
        "./util": 48,
        buffer: 6,
        crypto: 6,
      },
    ],
    30: [
      function (e, t, r) {
        var n = e("./forge");
        e("./util");
        var i = (t.exports = n.pem = n.pem || {});
        function a(e) {
          for (
            var t = e.name + ": ",
              r = [],
              n = function (e, t) {
                return " " + t;
              },
              i = 0;
            i < e.values.length;
            ++i
          )
            r.push(e.values[i].replace(/^(\S+\r\n)/, n));
          t += r.join(",") + "\r\n";
          var a = 0,
            s = -1;
          for (i = 0; i < t.length; ++i, ++a)
            if (a > 65 && -1 !== s) {
              var o = t[s];
              "," === o
                ? (++s, (t = t.substr(0, s) + "\r\n " + t.substr(s)))
                : (t = t.substr(0, s) + "\r\n" + o + t.substr(s + 1)),
                (a = i - s - 1),
                (s = -1),
                ++i;
            } else (" " !== t[i] && "  " !== t[i] && "," !== t[i]) || (s = i);
          return t;
        }
        function s(e) {
          return e.replace(/^\s+/, "");
        }
        (i.encode = function (e, t) {
          t = t || {};
          var r,
            i = "-----BEGIN " + e.type + "-----\r\n";
          if (
            (e.procType &&
              (i += a(
                (r = {
                  name: "Proc-Type",
                  values: [String(e.procType.version), e.procType.type],
                })
              )),
            e.contentDomain &&
              (i += a(
                (r = { name: "Content-Domain", values: [e.contentDomain] })
              )),
            e.dekInfo &&
              ((r = { name: "DEK-Info", values: [e.dekInfo.algorithm] }),
              e.dekInfo.parameters && r.values.push(e.dekInfo.parameters),
              (i += a(r))),
            e.headers)
          )
            for (var s = 0; s < e.headers.length; ++s) i += a(e.headers[s]);
          return (
            e.procType && (i += "\r\n"),
            (i += n.util.encode64(e.body, t.maxline || 64) + "\r\n"),
            (i += "-----END " + e.type + "-----\r\n")
          );
        }),
          (i.decode = function (e) {
            for (
              var t,
                r = [],
                i =
                  /\s*-----BEGIN ([A-Z0-9- ]+)-----\r?\n?([\x21-\x7e\s]+?(?:\r?\n\r?\n))?([:A-Za-z0-9+\/=\s]+?)-----END \1-----/g,
                a = /([\x21-\x7e]+):\s*([\x21-\x7e\s^:]+)/,
                o = /\r?\n/;
              (t = i.exec(e));

            ) {
              var c = {
                type: t[1],
                procType: null,
                contentDomain: null,
                dekInfo: null,
                headers: [],
                body: n.util.decode64(t[3]),
              };
              if ((r.push(c), t[2])) {
                for (var u = t[2].split(o), l = 0; t && l < u.length; ) {
                  for (
                    var _ = u[l].replace(/\s+$/, ""), p = l + 1;
                    p < u.length;
                    ++p
                  ) {
                    var f = u[p];
                    if (!/\s/.test(f[0])) break;
                    (_ += f), (l = p);
                  }
                  if ((t = _.match(a))) {
                    for (
                      var h = { name: t[1], values: [] },
                        d = t[2].split(","),
                        $ = 0;
                      $ < d.length;
                      ++$
                    )
                      h.values.push(s(d[$]));
                    if (c.procType) {
                      if (c.contentDomain || "Content-Domain" !== h.name) {
                        if (c.dekInfo || "DEK-Info" !== h.name)
                          c.headers.push(h);
                        else {
                          if (0 === h.values.length)
                            throw Error(
                              'Invalid PEM formatted message. The "DEK-Info" header must have at least one subfield.'
                            );
                          c.dekInfo = {
                            algorithm: d[0],
                            parameters: d[1] || null,
                          };
                        }
                      } else c.contentDomain = d[0] || "";
                    } else {
                      if ("Proc-Type" !== h.name)
                        throw Error(
                          'Invalid PEM formatted message. The first encapsulated header must be "Proc-Type".'
                        );
                      if (2 !== h.values.length)
                        throw Error(
                          'Invalid PEM formatted message. The "Proc-Type" header must have two subfields.'
                        );
                      c.procType = { version: d[0], type: d[1] };
                    }
                  }
                  ++l;
                }
                if ("ENCRYPTED" === c.procType && !c.dekInfo)
                  throw Error(
                    'Invalid PEM formatted message. The "DEK-Info" header must be present if "Proc-Type" is "ENCRYPTED".'
                  );
              }
            }
            if (0 === r.length) throw Error("Invalid PEM formatted message.");
            return r;
          });
      },
      { "./forge": 16, "./util": 48 },
    ],
    31: [
      function (e, t, r) {
        var n = e("./forge");
        e("./util"), e("./random"), e("./sha1");
        var i = (t.exports = n.pkcs1 = n.pkcs1 || {});
        function a(e, t, r) {
          r || (r = n.md.sha1.create());
          for (
            var i = "", a = Math.ceil(t / r.digestLength), s = 0;
            s < a;
            ++s
          ) {
            var o = String.fromCharCode(
              (s >> 24) & 255,
              (s >> 16) & 255,
              (s >> 8) & 255,
              255 & s
            );
            r.start(), r.update(e + o), (i += r.digest().getBytes());
          }
          return i.substring(0, t);
        }
        (i.encode_rsa_oaep = function (e, t, r) {
          "string" == typeof r
            ? ((i = r),
              (s = arguments[3] || void 0),
              (o = arguments[4] || void 0))
            : r &&
              ((i = r.label || void 0),
              (s = r.seed || void 0),
              (o = r.md || void 0),
              r.mgf1 && r.mgf1.md && (c = r.mgf1.md)),
            o ? o.start() : (o = n.md.sha1.create()),
            c || (c = o);
          var i,
            s,
            o,
            c,
            u,
            l = Math.ceil(e.n.bitLength() / 8),
            _ = l - 2 * o.digestLength - 2;
          if (t.length > _)
            throw (
              (((u = Error(
                "RSAES-OAEP input message length is too long."
              )).length = t.length),
              (u.maxLength = _),
              u)
            );
          i || (i = ""), o.update(i, "raw");
          for (var p = o.digest(), f = "", h = _ - t.length, d = 0; d < h; d++)
            f += "\0";
          var $ = p.getBytes() + f + "\x01" + t;
          if (s) {
            if (s.length !== o.digestLength)
              throw (
                (((u = Error(
                  "Invalid RSAES-OAEP seed. The seed length must match the digest length."
                )).seedLength = s.length),
                (u.digestLength = o.digestLength),
                u)
              );
          } else s = n.random.getBytes(o.digestLength);
          var g = a(s, l - o.digestLength - 1, c),
            y = n.util.xorBytes($, g, $.length),
            m = a(y, o.digestLength, c);
          return "\0" + n.util.xorBytes(s, m, s.length) + y;
        }),
          (i.decode_rsa_oaep = function (e, t, r) {
            "string" == typeof r
              ? ((i = r), (s = arguments[3] || void 0))
              : r &&
                ((i = r.label || void 0),
                (s = r.md || void 0),
                r.mgf1 && r.mgf1.md && (o = r.mgf1.md));
            var i,
              s,
              o,
              c = Math.ceil(e.n.bitLength() / 8);
            if (t.length !== c)
              throw (
                (((g = Error(
                  "RSAES-OAEP encoded message length is invalid."
                )).length = t.length),
                (g.expectedLength = c),
                g)
              );
            if (
              (void 0 === s ? (s = n.md.sha1.create()) : s.start(),
              o || (o = s),
              c < 2 * s.digestLength + 2)
            )
              throw Error("RSAES-OAEP key is too short for the hash function.");
            i || (i = ""), s.update(i, "raw");
            for (
              var u = s.digest().getBytes(),
                l = t.charAt(0),
                _ = t.substring(1, s.digestLength + 1),
                p = t.substring(1 + s.digestLength),
                f = a(p, s.digestLength, o),
                h = a(
                  n.util.xorBytes(_, f, _.length),
                  c - s.digestLength - 1,
                  o
                ),
                d = n.util.xorBytes(p, h, p.length),
                $ = d.substring(0, s.digestLength),
                g = "\0" !== l,
                y = 0;
              y < s.digestLength;
              ++y
            )
              g |= u.charAt(y) !== $.charAt(y);
            for (
              var m = 1, v = s.digestLength, C = s.digestLength;
              C < d.length;
              C++
            ) {
              var E = d.charCodeAt(C);
              (g |= E & (m ? 65534 : 0)), (v += m &= (1 & E) ^ 1);
            }
            if (g || 1 !== d.charCodeAt(v))
              throw Error("Invalid RSAES-OAEP padding.");
            return d.substring(v + 1);
          });
      },
      { "./forge": 16, "./random": 39, "./sha1": 42, "./util": 48 },
    ],
    32: [
      function (e, t, r) {
        var n = e("./forge");
        e("./asn1"),
          e("./hmac"),
          e("./oids"),
          e("./pkcs7asn1"),
          e("./pbe"),
          e("./random"),
          e("./rsa"),
          e("./sha1"),
          e("./util"),
          e("./x509");
        var i = n.asn1,
          a = n.pki,
          s = (t.exports = n.pkcs12 = n.pkcs12 || {}),
          o = {
            name: "ContentInfo",
            tagClass: i.Class.UNIVERSAL,
            type: i.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "ContentInfo.contentType",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.OID,
                constructed: !1,
                capture: "contentType",
              },
              {
                name: "ContentInfo.content",
                tagClass: i.Class.CONTEXT_SPECIFIC,
                constructed: !0,
                captureAsn1: "content",
              },
            ],
          },
          c = {
            name: "PFX",
            tagClass: i.Class.UNIVERSAL,
            type: i.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "PFX.version",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.INTEGER,
                constructed: !1,
                capture: "version",
              },
              o,
              {
                name: "PFX.macData",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.SEQUENCE,
                constructed: !0,
                optional: !0,
                captureAsn1: "mac",
                value: [
                  {
                    name: "PFX.macData.mac",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.SEQUENCE,
                    constructed: !0,
                    value: [
                      {
                        name: "PFX.macData.mac.digestAlgorithm",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.SEQUENCE,
                        constructed: !0,
                        value: [
                          {
                            name: "PFX.macData.mac.digestAlgorithm.algorithm",
                            tagClass: i.Class.UNIVERSAL,
                            type: i.Type.OID,
                            constructed: !1,
                            capture: "macAlgorithm",
                          },
                          {
                            name: "PFX.macData.mac.digestAlgorithm.parameters",
                            tagClass: i.Class.UNIVERSAL,
                            captureAsn1: "macAlgorithmParameters",
                          },
                        ],
                      },
                      {
                        name: "PFX.macData.mac.digest",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.OCTETSTRING,
                        constructed: !1,
                        capture: "macDigest",
                      },
                    ],
                  },
                  {
                    name: "PFX.macData.macSalt",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.OCTETSTRING,
                    constructed: !1,
                    capture: "macSalt",
                  },
                  {
                    name: "PFX.macData.iterations",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.INTEGER,
                    constructed: !1,
                    optional: !0,
                    capture: "macIterations",
                  },
                ],
              },
            ],
          },
          u = {
            name: "SafeBag",
            tagClass: i.Class.UNIVERSAL,
            type: i.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "SafeBag.bagId",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.OID,
                constructed: !1,
                capture: "bagId",
              },
              {
                name: "SafeBag.bagValue",
                tagClass: i.Class.CONTEXT_SPECIFIC,
                constructed: !0,
                captureAsn1: "bagValue",
              },
              {
                name: "SafeBag.bagAttributes",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.SET,
                constructed: !0,
                optional: !0,
                capture: "bagAttributes",
              },
            ],
          },
          l = {
            name: "Attribute",
            tagClass: i.Class.UNIVERSAL,
            type: i.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "Attribute.attrId",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.OID,
                constructed: !1,
                capture: "oid",
              },
              {
                name: "Attribute.attrValues",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.SET,
                constructed: !0,
                capture: "values",
              },
            ],
          },
          _ = {
            name: "CertBag",
            tagClass: i.Class.UNIVERSAL,
            type: i.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "CertBag.certId",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.OID,
                constructed: !1,
                capture: "certId",
              },
              {
                name: "CertBag.certValue",
                tagClass: i.Class.CONTEXT_SPECIFIC,
                constructed: !0,
                value: [
                  {
                    name: "CertBag.certValue[0]",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Class.OCTETSTRING,
                    constructed: !1,
                    capture: "cert",
                  },
                ],
              },
            ],
          };
        function p(e, t, r, n) {
          for (var i = [], a = 0; a < e.length; a++)
            for (var s = 0; s < e[a].safeBags.length; s++) {
              var o = e[a].safeBags[s];
              (void 0 !== n && o.type !== n) ||
                (null !== t
                  ? void 0 !== o.attributes[t] &&
                    o.attributes[t].indexOf(r) >= 0 &&
                    i.push(o)
                  : i.push(o));
            }
          return i;
        }
        function f(e) {
          if (e.composed || e.constructed) {
            for (var t = n.util.createBuffer(), r = 0; r < e.value.length; ++r)
              t.putBytes(e.value[r].value);
            (e.composed = e.constructed = !1), (e.value = t.getBytes());
          }
          return e;
        }
        function h(e, t) {
          var r = {},
            s = [];
          if (!i.validate(e, n.pkcs7.asn1.encryptedDataValidator, r, s))
            throw (
              (((o = Error("Cannot read EncryptedContentInfo.")).errors = s), o)
            );
          var o,
            c = i.derToOid(r.contentType);
          if (c !== a.oids.data)
            throw (
              (((o = Error(
                "PKCS#12 EncryptedContentInfo ContentType is not Data."
              )).oid = c),
              o)
            );
          c = i.derToOid(r.encAlgorithm);
          var u = a.pbe.getCipher(c, r.encParameter, t),
            l = f(r.encryptedContentAsn1),
            _ = n.util.createBuffer(l.value);
          if ((u.update(_), !u.finish()))
            throw Error("Failed to decrypt PKCS#12 SafeContents.");
          return u.output.getBytes();
        }
        function d(e, t, r) {
          if (!t && 0 === e.length) return [];
          if (
            (e = i.fromDer(e, t)).tagClass !== i.Class.UNIVERSAL ||
            e.type !== i.Type.SEQUENCE ||
            !0 !== e.constructed
          )
            throw Error(
              "PKCS#12 SafeContents expected to be a SEQUENCE OF SafeBag."
            );
          for (var n = [], s = 0; s < e.value.length; s++) {
            var o,
              c = e.value[s],
              l = {},
              p = [];
            if (!i.validate(c, u, l, p))
              throw (((o = Error("Cannot read SafeBag.")).errors = p), o);
            var f,
              h,
              d = { type: i.derToOid(l.bagId), attributes: $(l.bagAttributes) };
            n.push(d);
            var g = l.bagValue.value[0];
            switch (d.type) {
              case a.oids.pkcs8ShroudedKeyBag:
                if (null === (g = a.decryptPrivateKeyInfo(g, r)))
                  throw Error(
                    "Unable to decrypt PKCS#8 ShroudedKeyBag, wrong password?"
                  );
              case a.oids.keyBag:
                try {
                  d.key = a.privateKeyFromAsn1(g);
                } catch (y) {
                  (d.key = null), (d.asn1 = g);
                }
                continue;
              case a.oids.certBag:
                (f = _),
                  (h = function () {
                    if (i.derToOid(l.certId) !== a.oids.x509Certificate) {
                      var e = Error(
                        "Unsupported certificate type, only X.509 supported."
                      );
                      throw ((e.oid = i.derToOid(l.certId)), e);
                    }
                    var r = i.fromDer(l.cert, t);
                    try {
                      d.cert = a.certificateFromAsn1(r, !0);
                    } catch (n) {
                      (d.cert = null), (d.asn1 = r);
                    }
                  });
                break;
              default:
                throw (
                  (((o = Error("Unsupported PKCS#12 SafeBag type.")).oid =
                    d.type),
                  o)
                );
            }
            if (void 0 !== f && !i.validate(g, f, l, p))
              throw (
                (((o = Error("Cannot read PKCS#12 " + f.name)).errors = p), o)
              );
            h();
          }
          return n;
        }
        function $(e) {
          var t = {};
          if (void 0 !== e)
            for (var r = 0; r < e.length; ++r) {
              var n = {},
                s = [];
              if (!i.validate(e[r], l, n, s)) {
                var o = Error("Cannot read PKCS#12 BagAttribute.");
                throw ((o.errors = s), o);
              }
              var c = i.derToOid(n.oid);
              if (void 0 !== a.oids[c]) {
                t[a.oids[c]] = [];
                for (var u = 0; u < n.values.length; ++u)
                  t[a.oids[c]].push(n.values[u].value);
              }
            }
          return t;
        }
        (s.pkcs12FromAsn1 = function (e, t, r) {
          "string" == typeof t ? ((r = t), (t = !0)) : void 0 === t && (t = !0);
          var u = {};
          if (!i.validate(e, c, u, []))
            throw (
              (((l = Error(
                "Cannot read PKCS#12 PFX. ASN.1 object is not an PKCS#12 PFX."
              )).errors = l),
              l)
            );
          var l,
            _ = {
              version: u.version.charCodeAt(0),
              safeContents: [],
              getBags: function (e) {
                var t,
                  r = {};
                return (
                  "localKeyId" in e
                    ? (t = e.localKeyId)
                    : "localKeyIdHex" in e &&
                      (t = n.util.hexToBytes(e.localKeyIdHex)),
                  void 0 === t &&
                    !("friendlyName" in e) &&
                    "bagType" in e &&
                    (r[e.bagType] = p(_.safeContents, null, null, e.bagType)),
                  void 0 !== t &&
                    (r.localKeyId = p(
                      _.safeContents,
                      "localKeyId",
                      t,
                      e.bagType
                    )),
                  "friendlyName" in e &&
                    (r.friendlyName = p(
                      _.safeContents,
                      "friendlyName",
                      e.friendlyName,
                      e.bagType
                    )),
                  r
                );
              },
              getBagsByFriendlyName: function (e, t) {
                return p(_.safeContents, "friendlyName", e, t);
              },
              getBagsByLocalKeyId: function (e, t) {
                return p(_.safeContents, "localKeyId", e, t);
              },
            };
          if (3 !== u.version.charCodeAt(0))
            throw (
              (((l = Error(
                "PKCS#12 PFX of version other than 3 not supported."
              )).version = u.version.charCodeAt(0)),
              l)
            );
          if (i.derToOid(u.contentType) !== a.oids.data)
            throw (
              (((l = Error(
                "Only PKCS#12 PFX in password integrity mode supported."
              )).oid = i.derToOid(u.contentType)),
              l)
            );
          var $ = u.content.value[0];
          if ($.tagClass !== i.Class.UNIVERSAL || $.type !== i.Type.OCTETSTRING)
            throw Error(
              "PKCS#12 authSafe content data is not an OCTET STRING."
            );
          if ((($ = f($)), u.mac)) {
            var g = null,
              y = 0,
              m = i.derToOid(u.macAlgorithm);
            switch (m) {
              case a.oids.sha1:
                (g = n.md.sha1.create()), (y = 20);
                break;
              case a.oids.sha256:
                (g = n.md.sha256.create()), (y = 32);
                break;
              case a.oids.sha384:
                (g = n.md.sha384.create()), (y = 48);
                break;
              case a.oids.sha512:
                (g = n.md.sha512.create()), (y = 64);
                break;
              case a.oids.md5:
                (g = n.md.md5.create()), (y = 16);
            }
            if (null === g)
              throw Error("PKCS#12 uses unsupported MAC algorithm: " + m);
            var v = new n.util.ByteBuffer(u.macSalt),
              C =
                "macIterations" in u
                  ? parseInt(n.util.bytesToHex(u.macIterations), 16)
                  : 1,
              E = s.generateKey(r, v, 3, C, y, g),
              S = n.hmac.create();
            if (
              (S.start(g, E),
              S.update($.value),
              S.getMac().getBytes() !== u.macDigest)
            )
              throw Error(
                "PKCS#12 MAC could not be verified. Invalid password?"
              );
          }
          return (
            (function (e, t, r, n) {
              if (
                (t = i.fromDer(t, r)).tagClass !== i.Class.UNIVERSAL ||
                t.type !== i.Type.SEQUENCE ||
                !0 !== t.constructed
              )
                throw Error(
                  "PKCS#12 AuthenticatedSafe expected to be a SEQUENCE OF ContentInfo"
                );
              for (var s = 0; s < t.value.length; s++) {
                var c = t.value[s],
                  u = {},
                  l = [];
                if (!i.validate(c, o, u, l)) {
                  var _ = Error("Cannot read ContentInfo.");
                  throw ((_.errors = l), _);
                }
                var p = { encrypted: !1 },
                  $ = null,
                  g = u.content.value[0];
                switch (i.derToOid(u.contentType)) {
                  case a.oids.data:
                    if (
                      g.tagClass !== i.Class.UNIVERSAL ||
                      g.type !== i.Type.OCTETSTRING
                    )
                      throw Error(
                        "PKCS#12 SafeContents Data is not an OCTET STRING."
                      );
                    $ = f(g).value;
                    break;
                  case a.oids.encryptedData:
                    ($ = h(g, n)), (p.encrypted = !0);
                    break;
                  default:
                    var _ = Error("Unsupported PKCS#12 contentType.");
                    throw ((_.contentType = i.derToOid(u.contentType)), _);
                }
                (p.safeBags = d($, r, n)), e.safeContents.push(p);
              }
            })(_, $.value, t, r),
            _
          );
        }),
          (s.toPkcs12Asn1 = function (e, t, r, o) {
            ((o = o || {}).saltSize = o.saltSize || 8),
              (o.count = o.count || 2048),
              (o.algorithm = o.algorithm || o.encAlgorithm || "aes128"),
              "useMac" in o || (o.useMac = !0),
              "localKeyId" in o || (o.localKeyId = null),
              "generateLocalKeyId" in o || (o.generateLocalKeyId = !0);
            var c,
              u = o.localKeyId;
            if (null !== u) u = n.util.hexToBytes(u);
            else if (o.generateLocalKeyId) {
              if (t) {
                var l = n.util.isArray(t) ? t[0] : t;
                "string" == typeof l && (l = a.certificateFromPem(l)),
                  (A = n.md.sha1.create()).update(
                    i.toDer(a.certificateToAsn1(l)).getBytes()
                  ),
                  (u = A.digest().getBytes());
              } else u = n.random.getBytes(20);
            }
            var _ = [];
            null !== u &&
              _.push(
                i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                  i.create(
                    i.Class.UNIVERSAL,
                    i.Type.OID,
                    !1,
                    i.oidToDer(a.oids.localKeyId).getBytes()
                  ),
                  i.create(i.Class.UNIVERSAL, i.Type.SET, !0, [
                    i.create(i.Class.UNIVERSAL, i.Type.OCTETSTRING, !1, u),
                  ]),
                ])
              ),
              "friendlyName" in o &&
                _.push(
                  i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                    i.create(
                      i.Class.UNIVERSAL,
                      i.Type.OID,
                      !1,
                      i.oidToDer(a.oids.friendlyName).getBytes()
                    ),
                    i.create(i.Class.UNIVERSAL, i.Type.SET, !0, [
                      i.create(
                        i.Class.UNIVERSAL,
                        i.Type.BMPSTRING,
                        !1,
                        o.friendlyName
                      ),
                    ]),
                  ])
                ),
              _.length > 0 &&
                (c = i.create(i.Class.UNIVERSAL, i.Type.SET, !0, _));
            var p = [],
              f = [];
            null !== t && (f = n.util.isArray(t) ? t : [t]);
            for (var h = [], d = 0; d < f.length; ++d) {
              "string" == typeof (t = f[d]) && (t = a.certificateFromPem(t));
              var $ = 0 === d ? c : void 0,
                g = a.certificateToAsn1(t),
                y = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                  i.create(
                    i.Class.UNIVERSAL,
                    i.Type.OID,
                    !1,
                    i.oidToDer(a.oids.certBag).getBytes()
                  ),
                  i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [
                    i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                      i.create(
                        i.Class.UNIVERSAL,
                        i.Type.OID,
                        !1,
                        i.oidToDer(a.oids.x509Certificate).getBytes()
                      ),
                      i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [
                        i.create(
                          i.Class.UNIVERSAL,
                          i.Type.OCTETSTRING,
                          !1,
                          i.toDer(g).getBytes()
                        ),
                      ]),
                    ]),
                  ]),
                  $,
                ]);
              h.push(y);
            }
            if (h.length > 0) {
              var m = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, h),
                v = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                  i.create(
                    i.Class.UNIVERSAL,
                    i.Type.OID,
                    !1,
                    i.oidToDer(a.oids.data).getBytes()
                  ),
                  i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [
                    i.create(
                      i.Class.UNIVERSAL,
                      i.Type.OCTETSTRING,
                      !1,
                      i.toDer(m).getBytes()
                    ),
                  ]),
                ]);
              p.push(v);
            }
            var C = null;
            if (null !== e) {
              var E = a.wrapRsaPrivateKey(a.privateKeyToAsn1(e));
              C =
                null === r
                  ? i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                      i.create(
                        i.Class.UNIVERSAL,
                        i.Type.OID,
                        !1,
                        i.oidToDer(a.oids.keyBag).getBytes()
                      ),
                      i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [E]),
                      c,
                    ])
                  : i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                      i.create(
                        i.Class.UNIVERSAL,
                        i.Type.OID,
                        !1,
                        i.oidToDer(a.oids.pkcs8ShroudedKeyBag).getBytes()
                      ),
                      i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [
                        a.encryptPrivateKeyInfo(E, r, o),
                      ]),
                      c,
                    ]);
              var S = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [C]),
                b = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                  i.create(
                    i.Class.UNIVERSAL,
                    i.Type.OID,
                    !1,
                    i.oidToDer(a.oids.data).getBytes()
                  ),
                  i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [
                    i.create(
                      i.Class.UNIVERSAL,
                      i.Type.OCTETSTRING,
                      !1,
                      i.toDer(S).getBytes()
                    ),
                  ]),
                ]);
              p.push(b);
            }
            var T,
              I = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, p);
            if (o.useMac) {
              var A = n.md.sha1.create(),
                B = new n.util.ByteBuffer(n.random.getBytes(o.saltSize)),
                k = o.count,
                N = ((e = s.generateKey(r, B, 3, k, 20)), n.hmac.create());
              N.start(A, e), N.update(i.toDer(I).getBytes());
              var R = N.getMac();
              T = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                  i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                    i.create(
                      i.Class.UNIVERSAL,
                      i.Type.OID,
                      !1,
                      i.oidToDer(a.oids.sha1).getBytes()
                    ),
                    i.create(i.Class.UNIVERSAL, i.Type.NULL, !1, ""),
                  ]),
                  i.create(
                    i.Class.UNIVERSAL,
                    i.Type.OCTETSTRING,
                    !1,
                    R.getBytes()
                  ),
                ]),
                i.create(
                  i.Class.UNIVERSAL,
                  i.Type.OCTETSTRING,
                  !1,
                  B.getBytes()
                ),
                i.create(
                  i.Class.UNIVERSAL,
                  i.Type.INTEGER,
                  !1,
                  i.integerToDer(k).getBytes()
                ),
              ]);
            }
            return i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
              i.create(
                i.Class.UNIVERSAL,
                i.Type.INTEGER,
                !1,
                i.integerToDer(3).getBytes()
              ),
              i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                i.create(
                  i.Class.UNIVERSAL,
                  i.Type.OID,
                  !1,
                  i.oidToDer(a.oids.data).getBytes()
                ),
                i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [
                  i.create(
                    i.Class.UNIVERSAL,
                    i.Type.OCTETSTRING,
                    !1,
                    i.toDer(I).getBytes()
                  ),
                ]),
              ]),
              T,
            ]);
          }),
          (s.generateKey = n.pbe.generatePkcs12Key);
      },
      {
        "./asn1": 9,
        "./forge": 16,
        "./hmac": 17,
        "./oids": 27,
        "./pbe": 28,
        "./pkcs7asn1": 34,
        "./random": 39,
        "./rsa": 41,
        "./sha1": 42,
        "./util": 48,
        "./x509": 49,
      },
    ],
    33: [
      function (e, t, r) {
        var n = e("./forge");
        e("./aes"),
          e("./asn1"),
          e("./des"),
          e("./oids"),
          e("./pem"),
          e("./pkcs7asn1"),
          e("./random"),
          e("./util"),
          e("./x509");
        var i = n.asn1,
          a = (t.exports = n.pkcs7 = n.pkcs7 || {});
        function s(e) {
          var t = {},
            r = [];
          if (!i.validate(e, a.asn1.recipientInfoValidator, t, r)) {
            var s = Error(
              "Cannot read PKCS#7 RecipientInfo. ASN.1 object is not an PKCS#7 RecipientInfo."
            );
            throw ((s.errors = r), s);
          }
          return {
            version: t.version.charCodeAt(0),
            issuer: n.pki.RDNAttributesAsArray(t.issuer),
            serialNumber: n.util.createBuffer(t.serial).toHex(),
            encryptedContent: {
              algorithm: i.derToOid(t.encAlgorithm),
              parameter: t.encParameter.value,
              content: t.encKey,
            },
          };
        }
        function o(e) {
          var t = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
            i.create(
              i.Class.UNIVERSAL,
              i.Type.INTEGER,
              !1,
              i.integerToDer(e.version).getBytes()
            ),
            i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
              n.pki.distinguishedNameToAsn1({ attributes: e.issuer }),
              i.create(
                i.Class.UNIVERSAL,
                i.Type.INTEGER,
                !1,
                n.util.hexToBytes(e.serialNumber)
              ),
            ]),
            i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
              i.create(
                i.Class.UNIVERSAL,
                i.Type.OID,
                !1,
                i.oidToDer(e.digestAlgorithm).getBytes()
              ),
              i.create(i.Class.UNIVERSAL, i.Type.NULL, !1, ""),
            ]),
          ]);
          if (
            (e.authenticatedAttributesAsn1 &&
              t.value.push(e.authenticatedAttributesAsn1),
            t.value.push(
              i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                i.create(
                  i.Class.UNIVERSAL,
                  i.Type.OID,
                  !1,
                  i.oidToDer(e.signatureAlgorithm).getBytes()
                ),
                i.create(i.Class.UNIVERSAL, i.Type.NULL, !1, ""),
              ])
            ),
            t.value.push(
              i.create(i.Class.UNIVERSAL, i.Type.OCTETSTRING, !1, e.signature)
            ),
            e.unauthenticatedAttributes.length > 0)
          ) {
            for (
              var r = i.create(i.Class.CONTEXT_SPECIFIC, 1, !0, []), a = 0;
              a < e.unauthenticatedAttributes.length;
              ++a
            ) {
              var s = e.unauthenticatedAttributes[a];
              r.values.push(c(s));
            }
            t.value.push(r);
          }
          return t;
        }
        function c(e) {
          var t;
          if (e.type === n.pki.oids.contentType)
            t = i.create(
              i.Class.UNIVERSAL,
              i.Type.OID,
              !1,
              i.oidToDer(e.value).getBytes()
            );
          else if (e.type === n.pki.oids.messageDigest)
            t = i.create(
              i.Class.UNIVERSAL,
              i.Type.OCTETSTRING,
              !1,
              e.value.bytes()
            );
          else if (e.type === n.pki.oids.signingTime) {
            var r = new Date("1950-01-01T00:00:00Z"),
              a = new Date("2050-01-01T00:00:00Z"),
              s = e.value;
            if ("string" == typeof s) {
              var o = Date.parse(s);
              s = isNaN(o)
                ? 13 === s.length
                  ? i.utcTimeToDate(s)
                  : i.generalizedTimeToDate(s)
                : new Date(o);
            }
            t =
              s >= r && s < a
                ? i.create(
                    i.Class.UNIVERSAL,
                    i.Type.UTCTIME,
                    !1,
                    i.dateToUtcTime(s)
                  )
                : i.create(
                    i.Class.UNIVERSAL,
                    i.Type.GENERALIZEDTIME,
                    !1,
                    i.dateToGeneralizedTime(s)
                  );
          }
          return i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
            i.create(
              i.Class.UNIVERSAL,
              i.Type.OID,
              !1,
              i.oidToDer(e.type).getBytes()
            ),
            i.create(i.Class.UNIVERSAL, i.Type.SET, !0, [t]),
          ]);
        }
        function u(e, t, r) {
          var a = {};
          if (!i.validate(t, r, a, [])) {
            var s = Error(
              "Cannot read PKCS#7 message. ASN.1 object is not a supported PKCS#7 message."
            );
            throw ((s.errors = s), s);
          }
          if (i.derToOid(a.contentType) !== n.pki.oids.data)
            throw Error(
              "Unsupported PKCS#7 message. Only wrapped ContentType Data supported."
            );
          if (a.encryptedContent) {
            var o = "";
            if (n.util.isArray(a.encryptedContent))
              for (var c = 0; c < a.encryptedContent.length; ++c) {
                if (a.encryptedContent[c].type !== i.Type.OCTETSTRING)
                  throw Error(
                    "Malformed PKCS#7 message, expecting encrypted content constructed of only OCTET STRING objects."
                  );
                o += a.encryptedContent[c].value;
              }
            else o = a.encryptedContent;
            e.encryptedContent = {
              algorithm: i.derToOid(a.encAlgorithm),
              parameter: n.util.createBuffer(a.encParameter.value),
              content: n.util.createBuffer(o),
            };
          }
          if (a.content) {
            if (((o = ""), n.util.isArray(a.content)))
              for (c = 0; c < a.content.length; ++c) {
                if (a.content[c].type !== i.Type.OCTETSTRING)
                  throw Error(
                    "Malformed PKCS#7 message, expecting content constructed of only OCTET STRING objects."
                  );
                o += a.content[c].value;
              }
            else o = a.content;
            e.content = n.util.createBuffer(o);
          }
          return (e.version = a.version.charCodeAt(0)), (e.rawCapture = a), a;
        }
        function l(e) {
          if (void 0 === e.encryptedContent.key)
            throw Error("Symmetric key not available.");
          if (void 0 === e.content) {
            var t;
            switch (e.encryptedContent.algorithm) {
              case n.pki.oids["aes128-CBC"]:
              case n.pki.oids["aes192-CBC"]:
              case n.pki.oids["aes256-CBC"]:
                t = n.aes.createDecryptionCipher(e.encryptedContent.key);
                break;
              case n.pki.oids.desCBC:
              case n.pki.oids["des-EDE3-CBC"]:
                t = n.des.createDecryptionCipher(e.encryptedContent.key);
                break;
              default:
                throw Error(
                  "Unsupported symmetric cipher, OID " +
                    e.encryptedContent.algorithm
                );
            }
            if (
              (t.start(e.encryptedContent.parameter),
              t.update(e.encryptedContent.content),
              !t.finish())
            )
              throw Error("Symmetric decryption failed.");
            e.content = t.output;
          }
        }
        (a.messageFromPem = function (e) {
          var t = n.pem.decode(e)[0];
          if ("PKCS7" !== t.type) {
            var r = Error(
              'Could not convert PKCS#7 message from PEM; PEM header type is not "PKCS#7".'
            );
            throw ((r.headerType = t.type), r);
          }
          if (t.procType && "ENCRYPTED" === t.procType.type)
            throw Error(
              "Could not convert PKCS#7 message from PEM; PEM is encrypted."
            );
          var s = i.fromDer(t.body);
          return a.messageFromAsn1(s);
        }),
          (a.messageToPem = function (e, t) {
            var r = { type: "PKCS7", body: i.toDer(e.toAsn1()).getBytes() };
            return n.pem.encode(r, { maxline: t });
          }),
          (a.messageFromAsn1 = function (e) {
            var t = {},
              r = [];
            if (!i.validate(e, a.asn1.contentInfoValidator, t, r)) {
              var s = Error(
                "Cannot read PKCS#7 message. ASN.1 object is not an PKCS#7 ContentInfo."
              );
              throw ((s.errors = r), s);
            }
            var o,
              c = i.derToOid(t.contentType);
            switch (c) {
              case n.pki.oids.envelopedData:
                o = a.createEnvelopedData();
                break;
              case n.pki.oids.encryptedData:
                o = a.createEncryptedData();
                break;
              case n.pki.oids.signedData:
                o = a.createSignedData();
                break;
              default:
                throw Error(
                  "Cannot read PKCS#7 message. ContentType with OID " +
                    c +
                    " is not (yet) supported."
                );
            }
            return o.fromAsn1(t.content.value[0]), o;
          }),
          (a.createSignedData = function () {
            var e = null;
            return (e = {
              type: n.pki.oids.signedData,
              version: 1,
              certificates: [],
              crls: [],
              signers: [],
              digestAlgorithmIdentifiers: [],
              contentInfo: null,
              signerInfos: [],
              fromAsn1: function (t) {
                if (
                  (u(e, t, a.asn1.signedDataValidator),
                  (e.certificates = []),
                  (e.crls = []),
                  (e.digestAlgorithmIdentifiers = []),
                  (e.contentInfo = null),
                  (e.signerInfos = []),
                  e.rawCapture.certificates)
                )
                  for (
                    var r = e.rawCapture.certificates.value, i = 0;
                    i < r.length;
                    ++i
                  )
                    e.certificates.push(n.pki.certificateFromAsn1(r[i]));
              },
              toAsn1: function () {
                e.contentInfo || e.sign();
                for (var t = [], r = 0; r < e.certificates.length; ++r)
                  t.push(n.pki.certificateToAsn1(e.certificates[r]));
                var a = [],
                  s = i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [
                    i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                      i.create(
                        i.Class.UNIVERSAL,
                        i.Type.INTEGER,
                        !1,
                        i.integerToDer(e.version).getBytes()
                      ),
                      i.create(
                        i.Class.UNIVERSAL,
                        i.Type.SET,
                        !0,
                        e.digestAlgorithmIdentifiers
                      ),
                      e.contentInfo,
                    ]),
                  ]);
                return (
                  t.length > 0 &&
                    s.value[0].value.push(
                      i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, t)
                    ),
                  a.length > 0 &&
                    s.value[0].value.push(
                      i.create(i.Class.CONTEXT_SPECIFIC, 1, !0, a)
                    ),
                  s.value[0].value.push(
                    i.create(i.Class.UNIVERSAL, i.Type.SET, !0, e.signerInfos)
                  ),
                  i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                    i.create(
                      i.Class.UNIVERSAL,
                      i.Type.OID,
                      !1,
                      i.oidToDer(e.type).getBytes()
                    ),
                    s,
                  ])
                );
              },
              addSigner: function (t) {
                var r = t.issuer,
                  i = t.serialNumber;
                if (t.certificate) {
                  var a = t.certificate;
                  "string" == typeof a && (a = n.pki.certificateFromPem(a)),
                    (r = a.issuer.attributes),
                    (i = a.serialNumber);
                }
                var s = t.key;
                if (!s)
                  throw Error(
                    "Could not add PKCS#7 signer; no private key specified."
                  );
                "string" == typeof s && (s = n.pki.privateKeyFromPem(s));
                var o = t.digestAlgorithm || n.pki.oids.sha1;
                switch (o) {
                  case n.pki.oids.sha1:
                  case n.pki.oids.sha256:
                  case n.pki.oids.sha384:
                  case n.pki.oids.sha512:
                  case n.pki.oids.md5:
                    break;
                  default:
                    throw Error(
                      "Could not add PKCS#7 signer; unknown message digest algorithm: " +
                        o
                    );
                }
                var c = t.authenticatedAttributes || [];
                if (c.length > 0) {
                  for (var u = !1, l = !1, _ = 0; _ < c.length; ++_) {
                    var p = c[_];
                    if (u || p.type !== n.pki.oids.contentType) {
                      if (l || p.type !== n.pki.oids.messageDigest);
                      else if (((l = !0), u)) break;
                    } else if (((u = !0), l)) break;
                  }
                  if (!u || !l)
                    throw Error(
                      "Invalid signer.authenticatedAttributes. If signer.authenticatedAttributes is specified, then it must contain at least two attributes, PKCS #9 content-type and PKCS #9 message-digest."
                    );
                }
                e.signers.push({
                  key: s,
                  version: 1,
                  issuer: r,
                  serialNumber: i,
                  digestAlgorithm: o,
                  signatureAlgorithm: n.pki.oids.rsaEncryption,
                  signature: null,
                  authenticatedAttributes: c,
                  unauthenticatedAttributes: [],
                });
              },
              sign: function (t) {
                var r;
                (t = t || {}),
                  ("object" != typeof e.content || null === e.contentInfo) &&
                    ((e.contentInfo = i.create(
                      i.Class.UNIVERSAL,
                      i.Type.SEQUENCE,
                      !0,
                      [
                        i.create(
                          i.Class.UNIVERSAL,
                          i.Type.OID,
                          !1,
                          i.oidToDer(n.pki.oids.data).getBytes()
                        ),
                      ]
                    )),
                    "content" in e &&
                      (e.content instanceof n.util.ByteBuffer
                        ? (r = e.content.bytes())
                        : "string" == typeof e.content &&
                          (r = n.util.encodeUtf8(e.content)),
                      t.detached
                        ? (e.detachedContent = i.create(
                            i.Class.UNIVERSAL,
                            i.Type.OCTETSTRING,
                            !1,
                            r
                          ))
                        : e.contentInfo.value.push(
                            i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [
                              i.create(
                                i.Class.UNIVERSAL,
                                i.Type.OCTETSTRING,
                                !1,
                                r
                              ),
                            ])
                          ))),
                  0 !== e.signers.length &&
                    (function (t) {
                      if (
                        !(r = e.detachedContent
                          ? e.detachedContent
                          : (r = e.contentInfo.value[1]).value[0])
                      )
                        throw Error(
                          "Could not sign PKCS#7 message; there is no content to sign."
                        );
                      var r,
                        a = i.derToOid(e.contentInfo.value[0].value),
                        s = i.toDer(r);
                      for (var u in (s.getByte(),
                      i.getBerValueLength(s),
                      (s = s.getBytes()),
                      t))
                        t[u].start().update(s);
                      for (
                        var l = new Date(), _ = 0;
                        _ < e.signers.length;
                        ++_
                      ) {
                        var p = e.signers[_];
                        if (0 === p.authenticatedAttributes.length) {
                          if (a !== n.pki.oids.data)
                            throw Error(
                              "Invalid signer; authenticatedAttributes must be present when the ContentInfo content type is not PKCS#7 Data."
                            );
                        } else {
                          p.authenticatedAttributesAsn1 = i.create(
                            i.Class.CONTEXT_SPECIFIC,
                            0,
                            !0,
                            []
                          );
                          for (
                            var f = i.create(
                                i.Class.UNIVERSAL,
                                i.Type.SET,
                                !0,
                                []
                              ),
                              h = 0;
                            h < p.authenticatedAttributes.length;
                            ++h
                          ) {
                            var d = p.authenticatedAttributes[h];
                            d.type === n.pki.oids.messageDigest
                              ? (d.value = t[p.digestAlgorithm].digest())
                              : d.type === n.pki.oids.signingTime &&
                                (d.value || (d.value = l)),
                              f.value.push(c(d)),
                              p.authenticatedAttributesAsn1.value.push(c(d));
                          }
                          (s = i.toDer(f).getBytes()), p.md.start().update(s);
                        }
                        p.signature = p.key.sign(p.md, "RSASSA-PKCS1-V1_5");
                      }
                      e.signerInfos = (function (e) {
                        for (var t = [], r = 0; r < e.length; ++r)
                          t.push(o(e[r]));
                        return t;
                      })(e.signers);
                    })(
                      (function () {
                        for (var t = {}, r = 0; r < e.signers.length; ++r) {
                          var a = e.signers[r],
                            s = a.digestAlgorithm;
                          s in t || (t[s] = n.md[n.pki.oids[s]].create()),
                            0 === a.authenticatedAttributes.length
                              ? (a.md = t[s])
                              : (a.md = n.md[n.pki.oids[s]].create());
                        }
                        for (var s in ((e.digestAlgorithmIdentifiers = []), t))
                          e.digestAlgorithmIdentifiers.push(
                            i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                              i.create(
                                i.Class.UNIVERSAL,
                                i.Type.OID,
                                !1,
                                i.oidToDer(s).getBytes()
                              ),
                              i.create(i.Class.UNIVERSAL, i.Type.NULL, !1, ""),
                            ])
                          );
                        return t;
                      })()
                    );
              },
              verify: function () {
                throw Error(
                  "PKCS#7 signature verification not yet implemented."
                );
              },
              addCertificate: function (t) {
                "string" == typeof t && (t = n.pki.certificateFromPem(t)),
                  e.certificates.push(t);
              },
              addCertificateRevokationList: function (e) {
                throw Error("PKCS#7 CRL support not yet implemented.");
              },
            });
          }),
          (a.createEncryptedData = function () {
            var e = null;
            return (e = {
              type: n.pki.oids.encryptedData,
              version: 0,
              encryptedContent: { algorithm: n.pki.oids["aes256-CBC"] },
              fromAsn1: function (t) {
                u(e, t, a.asn1.encryptedDataValidator);
              },
              decrypt: function (t) {
                void 0 !== t && (e.encryptedContent.key = t), l(e);
              },
            });
          }),
          (a.createEnvelopedData = function () {
            var e = null;
            return (e = {
              type: n.pki.oids.envelopedData,
              version: 0,
              recipients: [],
              encryptedContent: { algorithm: n.pki.oids["aes256-CBC"] },
              fromAsn1: function (t) {
                var r = u(e, t, a.asn1.envelopedDataValidator);
                e.recipients = (function (e) {
                  for (var t = [], r = 0; r < e.length; ++r) t.push(s(e[r]));
                  return t;
                })(r.recipientInfos.value);
              },
              toAsn1: function () {
                var t;
                return i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                  i.create(
                    i.Class.UNIVERSAL,
                    i.Type.OID,
                    !1,
                    i.oidToDer(e.type).getBytes()
                  ),
                  i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [
                    i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                      i.create(
                        i.Class.UNIVERSAL,
                        i.Type.INTEGER,
                        !1,
                        i.integerToDer(e.version).getBytes()
                      ),
                      i.create(
                        i.Class.UNIVERSAL,
                        i.Type.SET,
                        !0,
                        (function e(t) {
                          for (var r, a = [], s = 0; s < t.length; ++s)
                            a.push(
                              ((r = t[s]),
                              i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                                i.create(
                                  i.Class.UNIVERSAL,
                                  i.Type.INTEGER,
                                  !1,
                                  i.integerToDer(r.version).getBytes()
                                ),
                                i.create(
                                  i.Class.UNIVERSAL,
                                  i.Type.SEQUENCE,
                                  !0,
                                  [
                                    n.pki.distinguishedNameToAsn1({
                                      attributes: r.issuer,
                                    }),
                                    i.create(
                                      i.Class.UNIVERSAL,
                                      i.Type.INTEGER,
                                      !1,
                                      n.util.hexToBytes(r.serialNumber)
                                    ),
                                  ]
                                ),
                                i.create(
                                  i.Class.UNIVERSAL,
                                  i.Type.SEQUENCE,
                                  !0,
                                  [
                                    i.create(
                                      i.Class.UNIVERSAL,
                                      i.Type.OID,
                                      !1,
                                      i
                                        .oidToDer(r.encryptedContent.algorithm)
                                        .getBytes()
                                    ),
                                    i.create(
                                      i.Class.UNIVERSAL,
                                      i.Type.NULL,
                                      !1,
                                      ""
                                    ),
                                  ]
                                ),
                                i.create(
                                  i.Class.UNIVERSAL,
                                  i.Type.OCTETSTRING,
                                  !1,
                                  r.encryptedContent.content
                                ),
                              ]))
                            );
                          return a;
                        })(e.recipients)
                      ),
                      i.create(
                        i.Class.UNIVERSAL,
                        i.Type.SEQUENCE,
                        !0,
                        ((t = e.encryptedContent),
                        [
                          i.create(
                            i.Class.UNIVERSAL,
                            i.Type.OID,
                            !1,
                            i.oidToDer(n.pki.oids.data).getBytes()
                          ),
                          i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                            i.create(
                              i.Class.UNIVERSAL,
                              i.Type.OID,
                              !1,
                              i.oidToDer(t.algorithm).getBytes()
                            ),
                            i.create(
                              i.Class.UNIVERSAL,
                              i.Type.OCTETSTRING,
                              !1,
                              t.parameter.getBytes()
                            ),
                          ]),
                          i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [
                            i.create(
                              i.Class.UNIVERSAL,
                              i.Type.OCTETSTRING,
                              !1,
                              t.content.getBytes()
                            ),
                          ]),
                        ])
                      ),
                    ]),
                  ]),
                ]);
              },
              findRecipient: function (t) {
                for (
                  var r = t.issuer.attributes, n = 0;
                  n < e.recipients.length;
                  ++n
                ) {
                  var i = e.recipients[n],
                    a = i.issuer;
                  if (
                    i.serialNumber === t.serialNumber &&
                    a.length === r.length
                  ) {
                    for (var s = !0, o = 0; o < r.length; ++o)
                      if (
                        a[o].type !== r[o].type ||
                        a[o].value !== r[o].value
                      ) {
                        s = !1;
                        break;
                      }
                    if (s) return i;
                  }
                }
                return null;
              },
              decrypt: function (t, r) {
                if (
                  void 0 === e.encryptedContent.key &&
                  void 0 !== t &&
                  void 0 !== r
                )
                  switch (t.encryptedContent.algorithm) {
                    case n.pki.oids.rsaEncryption:
                    case n.pki.oids.desCBC:
                      var i = r.decrypt(t.encryptedContent.content);
                      e.encryptedContent.key = n.util.createBuffer(i);
                      break;
                    default:
                      throw Error(
                        "Unsupported asymmetric cipher, OID " +
                          t.encryptedContent.algorithm
                      );
                  }
                l(e);
              },
              addRecipient: function (t) {
                e.recipients.push({
                  version: 0,
                  issuer: t.issuer.attributes,
                  serialNumber: t.serialNumber,
                  encryptedContent: {
                    algorithm: n.pki.oids.rsaEncryption,
                    key: t.publicKey,
                  },
                });
              },
              encrypt: function (t, r) {
                if (void 0 === e.encryptedContent.content) {
                  switch (
                    ((r = r || e.encryptedContent.algorithm),
                    (t = t || e.encryptedContent.key),
                    r)
                  ) {
                    case n.pki.oids["aes128-CBC"]:
                      (i = 16), (a = 16), (s = n.aes.createEncryptionCipher);
                      break;
                    case n.pki.oids["aes192-CBC"]:
                      (i = 24), (a = 16), (s = n.aes.createEncryptionCipher);
                      break;
                    case n.pki.oids["aes256-CBC"]:
                      (i = 32), (a = 16), (s = n.aes.createEncryptionCipher);
                      break;
                    case n.pki.oids["des-EDE3-CBC"]:
                      (i = 24), (a = 8), (s = n.des.createEncryptionCipher);
                      break;
                    default:
                      throw Error("Unsupported symmetric cipher, OID " + r);
                  }
                  if (void 0 === t)
                    t = n.util.createBuffer(n.random.getBytes(i));
                  else if (t.length() != i)
                    throw Error(
                      "Symmetric key has wrong length; got " +
                        t.length() +
                        " bytes, expected " +
                        i +
                        "."
                    );
                  (e.encryptedContent.algorithm = r),
                    (e.encryptedContent.key = t),
                    (e.encryptedContent.parameter = n.util.createBuffer(
                      n.random.getBytes(a)
                    ));
                  var i,
                    a,
                    s,
                    o = s(t);
                  if (
                    (o.start(e.encryptedContent.parameter.copy()),
                    o.update(e.content),
                    !o.finish())
                  )
                    throw Error("Symmetric encryption failed.");
                  e.encryptedContent.content = o.output;
                }
                for (var c = 0; c < e.recipients.length; ++c) {
                  var u = e.recipients[c];
                  if (void 0 === u.encryptedContent.content) {
                    if (
                      u.encryptedContent.algorithm === n.pki.oids.rsaEncryption
                    )
                      u.encryptedContent.content =
                        u.encryptedContent.key.encrypt(
                          e.encryptedContent.key.data
                        );
                    else
                      throw Error(
                        "Unsupported asymmetric cipher, OID " +
                          u.encryptedContent.algorithm
                      );
                  }
                }
              },
            });
          });
      },
      {
        "./aes": 7,
        "./asn1": 9,
        "./des": 14,
        "./forge": 16,
        "./oids": 27,
        "./pem": 30,
        "./pkcs7asn1": 34,
        "./random": 39,
        "./util": 48,
        "./x509": 49,
      },
    ],
    34: [
      function (e, t, r) {
        var n = e("./forge");
        e("./asn1"), e("./util");
        var i = n.asn1,
          a = (t.exports = n.pkcs7asn1 = n.pkcs7asn1 || {});
        (n.pkcs7 = n.pkcs7 || {}), (n.pkcs7.asn1 = a);
        var s = {
          name: "ContentInfo",
          tagClass: i.Class.UNIVERSAL,
          type: i.Type.SEQUENCE,
          constructed: !0,
          value: [
            {
              name: "ContentInfo.ContentType",
              tagClass: i.Class.UNIVERSAL,
              type: i.Type.OID,
              constructed: !1,
              capture: "contentType",
            },
            {
              name: "ContentInfo.content",
              tagClass: i.Class.CONTEXT_SPECIFIC,
              type: 0,
              constructed: !0,
              optional: !0,
              captureAsn1: "content",
            },
          ],
        };
        a.contentInfoValidator = s;
        var o = {
          name: "EncryptedContentInfo",
          tagClass: i.Class.UNIVERSAL,
          type: i.Type.SEQUENCE,
          constructed: !0,
          value: [
            {
              name: "EncryptedContentInfo.contentType",
              tagClass: i.Class.UNIVERSAL,
              type: i.Type.OID,
              constructed: !1,
              capture: "contentType",
            },
            {
              name: "EncryptedContentInfo.contentEncryptionAlgorithm",
              tagClass: i.Class.UNIVERSAL,
              type: i.Type.SEQUENCE,
              constructed: !0,
              value: [
                {
                  name: "EncryptedContentInfo.contentEncryptionAlgorithm.algorithm",
                  tagClass: i.Class.UNIVERSAL,
                  type: i.Type.OID,
                  constructed: !1,
                  capture: "encAlgorithm",
                },
                {
                  name: "EncryptedContentInfo.contentEncryptionAlgorithm.parameter",
                  tagClass: i.Class.UNIVERSAL,
                  captureAsn1: "encParameter",
                },
              ],
            },
            {
              name: "EncryptedContentInfo.encryptedContent",
              tagClass: i.Class.CONTEXT_SPECIFIC,
              type: 0,
              capture: "encryptedContent",
              captureAsn1: "encryptedContentAsn1",
            },
          ],
        };
        (a.envelopedDataValidator = {
          name: "EnvelopedData",
          tagClass: i.Class.UNIVERSAL,
          type: i.Type.SEQUENCE,
          constructed: !0,
          value: [
            {
              name: "EnvelopedData.Version",
              tagClass: i.Class.UNIVERSAL,
              type: i.Type.INTEGER,
              constructed: !1,
              capture: "version",
            },
            {
              name: "EnvelopedData.RecipientInfos",
              tagClass: i.Class.UNIVERSAL,
              type: i.Type.SET,
              constructed: !0,
              captureAsn1: "recipientInfos",
            },
          ].concat(o),
        }),
          (a.encryptedDataValidator = {
            name: "EncryptedData",
            tagClass: i.Class.UNIVERSAL,
            type: i.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "EncryptedData.Version",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.INTEGER,
                constructed: !1,
                capture: "version",
              },
            ].concat(o),
          });
        var c = {
          name: "SignerInfo",
          tagClass: i.Class.UNIVERSAL,
          type: i.Type.SEQUENCE,
          constructed: !0,
          value: [
            {
              name: "SignerInfo.version",
              tagClass: i.Class.UNIVERSAL,
              type: i.Type.INTEGER,
              constructed: !1,
            },
            {
              name: "SignerInfo.issuerAndSerialNumber",
              tagClass: i.Class.UNIVERSAL,
              type: i.Type.SEQUENCE,
              constructed: !0,
              value: [
                {
                  name: "SignerInfo.issuerAndSerialNumber.issuer",
                  tagClass: i.Class.UNIVERSAL,
                  type: i.Type.SEQUENCE,
                  constructed: !0,
                  captureAsn1: "issuer",
                },
                {
                  name: "SignerInfo.issuerAndSerialNumber.serialNumber",
                  tagClass: i.Class.UNIVERSAL,
                  type: i.Type.INTEGER,
                  constructed: !1,
                  capture: "serial",
                },
              ],
            },
            {
              name: "SignerInfo.digestAlgorithm",
              tagClass: i.Class.UNIVERSAL,
              type: i.Type.SEQUENCE,
              constructed: !0,
              value: [
                {
                  name: "SignerInfo.digestAlgorithm.algorithm",
                  tagClass: i.Class.UNIVERSAL,
                  type: i.Type.OID,
                  constructed: !1,
                  capture: "digestAlgorithm",
                },
                {
                  name: "SignerInfo.digestAlgorithm.parameter",
                  tagClass: i.Class.UNIVERSAL,
                  constructed: !1,
                  captureAsn1: "digestParameter",
                  optional: !0,
                },
              ],
            },
            {
              name: "SignerInfo.authenticatedAttributes",
              tagClass: i.Class.CONTEXT_SPECIFIC,
              type: 0,
              constructed: !0,
              optional: !0,
              capture: "authenticatedAttributes",
            },
            {
              name: "SignerInfo.digestEncryptionAlgorithm",
              tagClass: i.Class.UNIVERSAL,
              type: i.Type.SEQUENCE,
              constructed: !0,
              capture: "signatureAlgorithm",
            },
            {
              name: "SignerInfo.encryptedDigest",
              tagClass: i.Class.UNIVERSAL,
              type: i.Type.OCTETSTRING,
              constructed: !1,
              capture: "signature",
            },
            {
              name: "SignerInfo.unauthenticatedAttributes",
              tagClass: i.Class.CONTEXT_SPECIFIC,
              type: 1,
              constructed: !0,
              optional: !0,
              capture: "unauthenticatedAttributes",
            },
          ],
        };
        (a.signedDataValidator = {
          name: "SignedData",
          tagClass: i.Class.UNIVERSAL,
          type: i.Type.SEQUENCE,
          constructed: !0,
          value: [
            {
              name: "SignedData.Version",
              tagClass: i.Class.UNIVERSAL,
              type: i.Type.INTEGER,
              constructed: !1,
              capture: "version",
            },
            {
              name: "SignedData.DigestAlgorithms",
              tagClass: i.Class.UNIVERSAL,
              type: i.Type.SET,
              constructed: !0,
              captureAsn1: "digestAlgorithms",
            },
            s,
            {
              name: "SignedData.Certificates",
              tagClass: i.Class.CONTEXT_SPECIFIC,
              type: 0,
              optional: !0,
              captureAsn1: "certificates",
            },
            {
              name: "SignedData.CertificateRevocationLists",
              tagClass: i.Class.CONTEXT_SPECIFIC,
              type: 1,
              optional: !0,
              captureAsn1: "crls",
            },
            {
              name: "SignedData.SignerInfos",
              tagClass: i.Class.UNIVERSAL,
              type: i.Type.SET,
              capture: "signerInfos",
              optional: !0,
              value: [c],
            },
          ],
        }),
          (a.recipientInfoValidator = {
            name: "RecipientInfo",
            tagClass: i.Class.UNIVERSAL,
            type: i.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "RecipientInfo.version",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.INTEGER,
                constructed: !1,
                capture: "version",
              },
              {
                name: "RecipientInfo.issuerAndSerial",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.SEQUENCE,
                constructed: !0,
                value: [
                  {
                    name: "RecipientInfo.issuerAndSerial.issuer",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.SEQUENCE,
                    constructed: !0,
                    captureAsn1: "issuer",
                  },
                  {
                    name: "RecipientInfo.issuerAndSerial.serialNumber",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.INTEGER,
                    constructed: !1,
                    capture: "serial",
                  },
                ],
              },
              {
                name: "RecipientInfo.keyEncryptionAlgorithm",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.SEQUENCE,
                constructed: !0,
                value: [
                  {
                    name: "RecipientInfo.keyEncryptionAlgorithm.algorithm",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.OID,
                    constructed: !1,
                    capture: "encAlgorithm",
                  },
                  {
                    name: "RecipientInfo.keyEncryptionAlgorithm.parameter",
                    tagClass: i.Class.UNIVERSAL,
                    constructed: !1,
                    captureAsn1: "encParameter",
                  },
                ],
              },
              {
                name: "RecipientInfo.encryptedKey",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.OCTETSTRING,
                constructed: !1,
                capture: "encKey",
              },
            ],
          });
      },
      { "./asn1": 9, "./forge": 16, "./util": 48 },
    ],
    35: [
      function (e, t, r) {
        var n = e("./forge");
        e("./asn1"),
          e("./oids"),
          e("./pbe"),
          e("./pem"),
          e("./pbkdf2"),
          e("./pkcs12"),
          e("./pss"),
          e("./rsa"),
          e("./util"),
          e("./x509");
        var i = n.asn1,
          a = (t.exports = n.pki = n.pki || {});
        (a.pemToDer = function (e) {
          var t = n.pem.decode(e)[0];
          if (t.procType && "ENCRYPTED" === t.procType.type)
            throw Error("Could not convert PEM to DER; PEM is encrypted.");
          return n.util.createBuffer(t.body);
        }),
          (a.privateKeyFromPem = function (e) {
            var t = n.pem.decode(e)[0];
            if ("PRIVATE KEY" !== t.type && "RSA PRIVATE KEY" !== t.type) {
              var r = Error(
                'Could not convert private key from PEM; PEM header type is not "PRIVATE KEY" or "RSA PRIVATE KEY".'
              );
              throw ((r.headerType = t.type), r);
            }
            if (t.procType && "ENCRYPTED" === t.procType.type)
              throw Error(
                "Could not convert private key from PEM; PEM is encrypted."
              );
            var s = i.fromDer(t.body);
            return a.privateKeyFromAsn1(s);
          }),
          (a.privateKeyToPem = function (e, t) {
            var r = {
              type: "RSA PRIVATE KEY",
              body: i.toDer(a.privateKeyToAsn1(e)).getBytes(),
            };
            return n.pem.encode(r, { maxline: t });
          }),
          (a.privateKeyInfoToPem = function (e, t) {
            var r = { type: "PRIVATE KEY", body: i.toDer(e).getBytes() };
            return n.pem.encode(r, { maxline: t });
          });
      },
      {
        "./asn1": 9,
        "./forge": 16,
        "./oids": 27,
        "./pbe": 28,
        "./pbkdf2": 29,
        "./pem": 30,
        "./pkcs12": 32,
        "./pss": 38,
        "./rsa": 41,
        "./util": 48,
        "./x509": 49,
      },
    ],
    36: [
      function (e, t, r) {
        var n = e("./forge");
        e("./util"),
          e("./jsbn"),
          e("./random"),
          (function () {
            if (n.prime) t.exports = n.prime;
            else {
              var e = (t.exports = n.prime = n.prime || {}),
                r = n.jsbn.BigInteger,
                i = [6, 4, 2, 4, 2, 4, 6, 2],
                a = new r(null);
              a.fromInt(30);
              var s = function (e, t) {
                return e | t;
              };
              e.generateProbablePrime = function (e, t, i) {
                "function" == typeof t && ((i = t), (t = {}));
                var a,
                  s,
                  u,
                  l,
                  _ = (t = t || {}).algorithm || "PRIMEINC";
                "string" == typeof _ && (_ = { name: _ }),
                  (_.options = _.options || {});
                var p = t.prng || n.random;
                if ("PRIMEINC" === _.name)
                  return (
                    (a = e),
                    (s = {
                      nextBytes: function (e) {
                        for (
                          var t = p.getBytesSync(e.length), r = 0;
                          r < e.length;
                          ++r
                        )
                          e[r] = t.charCodeAt(r);
                      },
                    }),
                    (u = _.options),
                    (l = i),
                    "workers" in u
                      ? (function (e, t, i, a) {
                          if ("undefined" == typeof Worker)
                            return o(e, t, i, a);
                          var s = c(e, t),
                            u = i.workers,
                            l = i.workLoad || 100,
                            _ = (30 * l) / 8,
                            p = i.workerScript || "forge/prime.worker.js";
                          if (-1 === u)
                            return n.util.estimateCores(function (e, t) {
                              e && (t = 2), (u = t - 1), f();
                            });
                          function f() {
                            u = Math.max(1, u);
                            for (var n = [], i = 0; i < u; ++i)
                              n[i] = new Worker(p);
                            for (var i = 0; i < u; ++i)
                              n[i].addEventListener("message", f);
                            var o = !1;
                            function f(i) {
                              if (!o) {
                                var u = i.data;
                                if (u.found) {
                                  for (var p = 0; p < n.length; ++p)
                                    n[p].terminate();
                                  return (o = !0), a(null, new r(u.prime, 16));
                                }
                                s.bitLength() > e && (s = c(e, t));
                                var f = s.toString(16);
                                i.target.postMessage({ hex: f, workLoad: l }),
                                  s.dAddOffset(_, 0);
                              }
                            }
                          }
                          f();
                        })(a, s, u, l)
                      : o(a, s, u, l)
                  );
                throw Error("Invalid prime generation algorithm: " + _.name);
              };
            }
            function o(e, t, r, a) {
              var s,
                o = c(e, t),
                u =
                  (s = o.bitLength()) <= 100
                    ? 27
                    : s <= 150
                    ? 18
                    : s <= 200
                    ? 15
                    : s <= 250
                    ? 12
                    : s <= 300
                    ? 9
                    : s <= 350
                    ? 8
                    : s <= 400
                    ? 7
                    : s <= 500
                    ? 6
                    : s <= 600
                    ? 5
                    : s <= 800
                    ? 4
                    : s <= 1250
                    ? 3
                    : 2;
              "millerRabinTests" in r && (u = r.millerRabinTests);
              var l = 10;
              "maxBlockTime" in r && (l = r.maxBlockTime),
                (function e(t, r, a, s, o, u, l) {
                  var _ = +new Date();
                  do {
                    if (
                      (t.bitLength() > r && (t = c(r, a)), t.isProbablePrime(o))
                    )
                      return l(null, t);
                    t.dAddOffset(i[s++ % 8], 0);
                  } while (u < 0 || +new Date() - _ < u);
                  n.util.setImmediate(function () {
                    e(t, r, a, s, o, u, l);
                  });
                })(o, e, t, 0, u, l, a);
            }
            function c(e, t) {
              var n = new r(e, t),
                i = e - 1;
              return (
                n.testBit(i) || n.bitwiseTo(r.ONE.shiftLeft(i), s, n),
                n.dAddOffset(31 - n.mod(a).byteValue(), 0),
                n
              );
            }
          })();
      },
      { "./forge": 16, "./jsbn": 19, "./random": 39, "./util": 48 },
    ],
    37: [
      function (e, t, r) {
        (function (r) {
          var n = e("./forge");
          e("./util");
          var i = null;
          !n.util.isNodejs ||
            n.options.usePureJavaScript ||
            r.versions["node-webkit"] ||
            (i = e("crypto")),
            ((t.exports = n.prng = n.prng || {}).create = function (e) {
              for (
                var t = {
                    plugin: e,
                    key: null,
                    seed: null,
                    time: null,
                    reseeds: 0,
                    generated: 0,
                    keyBytes: "",
                  },
                  r = e.md,
                  a = Array(32),
                  s = 0;
                s < 32;
                ++s
              )
                a[s] = r.create();
              function o() {
                if (t.pools[0].messageLength >= 32) return c();
                var e = (32 - t.pools[0].messageLength) << 5;
                t.collect(t.seedFileSync(e)), c();
              }
              function c() {
                t.reseeds = 4294967295 === t.reseeds ? 0 : t.reseeds + 1;
                var e = t.plugin.md.create();
                e.update(t.keyBytes);
                for (var r = 1, n = 0; n < 32; ++n)
                  t.reseeds % r == 0 &&
                    (e.update(t.pools[n].digest().getBytes()),
                    t.pools[n].start()),
                    (r <<= 1);
                (t.keyBytes = e.digest().getBytes()),
                  e.start(),
                  e.update(t.keyBytes);
                var i = e.digest().getBytes();
                (t.key = t.plugin.formatKey(t.keyBytes)),
                  (t.seed = t.plugin.formatSeed(i)),
                  (t.generated = 0);
              }
              function u(e) {
                var t = null,
                  r = n.util.globalScope,
                  i = r.crypto || r.msCrypto;
                i &&
                  i.getRandomValues &&
                  (t = function (e) {
                    return i.getRandomValues(e);
                  });
                var a = n.util.createBuffer();
                if (t)
                  for (; a.length() < e; ) {
                    var s = Math.max(1, Math.min(e - a.length(), 65536) / 4),
                      o = new Uint32Array(Math.floor(s));
                    try {
                      t(o);
                      for (var c = 0; c < o.length; ++c) a.putInt32(o[c]);
                    } catch (u) {
                      if (
                        !(
                          "undefined" != typeof QuotaExceededError &&
                          u instanceof QuotaExceededError
                        )
                      )
                        throw u;
                    }
                  }
                if (a.length() < e)
                  for (
                    var l, _, p, f = Math.floor(65536 * Math.random());
                    a.length() < e;

                  )
                    for (
                      _ = 16807 * (65535 & f),
                        _ += (32767 & (l = 16807 * (f >> 16))) << 16,
                        f =
                          4294967295 &
                          (_ = (2147483647 & (_ += l >> 15)) + (_ >> 31)),
                        c = 0;
                      c < 3;
                      ++c
                    )
                      (p = f >>> (c << 3)),
                        (p ^= Math.floor(256 * Math.random())),
                        a.putByte(String.fromCharCode(255 & p));
                return a.getBytes(e);
              }
              return (
                (t.pools = a),
                (t.pool = 0),
                (t.generate = function (e, r) {
                  if (!r) return t.generateSync(e);
                  var i = t.plugin.cipher,
                    a = t.plugin.increment,
                    s = t.plugin.formatKey,
                    o = t.plugin.formatSeed,
                    u = n.util.createBuffer();
                  (t.key = null),
                    (function l(_) {
                      if (_) return r(_);
                      if (u.length() >= e) return r(null, u.getBytes(e));
                      if (
                        (t.generated > 1048575 && (t.key = null),
                        null === t.key)
                      )
                        return n.util.nextTick(function () {
                          !(function (e) {
                            if (t.pools[0].messageLength >= 32) return c(), e();
                            var r = (32 - t.pools[0].messageLength) << 5;
                            t.seedFile(r, function (r, n) {
                              if (r) return e(r);
                              t.collect(n), c(), e();
                            });
                          })(l);
                        });
                      var p = i(t.key, t.seed);
                      (t.generated += p.length),
                        u.putBytes(p),
                        (t.key = s(i(t.key, a(t.seed)))),
                        (t.seed = o(i(t.key, t.seed))),
                        n.util.setImmediate(l);
                    })();
                }),
                (t.generateSync = function (e) {
                  var r = t.plugin.cipher,
                    i = t.plugin.increment,
                    a = t.plugin.formatKey,
                    s = t.plugin.formatSeed;
                  t.key = null;
                  for (var c = n.util.createBuffer(); c.length() < e; ) {
                    t.generated > 1048575 && (t.key = null),
                      null === t.key && o();
                    var u = r(t.key, t.seed);
                    (t.generated += u.length),
                      c.putBytes(u),
                      (t.key = a(r(t.key, i(t.seed)))),
                      (t.seed = s(r(t.key, t.seed)));
                  }
                  return c.getBytes(e);
                }),
                i
                  ? ((t.seedFile = function (e, t) {
                      i.randomBytes(e, function (e, r) {
                        if (e) return t(e);
                        t(null, r.toString());
                      });
                    }),
                    (t.seedFileSync = function (e) {
                      return i.randomBytes(e).toString();
                    }))
                  : ((t.seedFile = function (e, t) {
                      try {
                        t(null, u(e));
                      } catch (r) {
                        t(r);
                      }
                    }),
                    (t.seedFileSync = u)),
                (t.collect = function (e) {
                  for (var r = e.length, n = 0; n < r; ++n)
                    t.pools[t.pool].update(e.substr(n, 1)),
                      (t.pool = 31 === t.pool ? 0 : t.pool + 1);
                }),
                (t.collectInt = function (e, r) {
                  for (var n = "", i = 0; i < r; i += 8)
                    n += String.fromCharCode((e >> i) & 255);
                  t.collect(n);
                }),
                (t.registerWorker = function (e) {
                  e === self
                    ? (t.seedFile = function (e, t) {
                        self.addEventListener("message", function e(r) {
                          var n = r.data;
                          n.forge &&
                            n.forge.prng &&
                            (self.removeEventListener("message", e),
                            t(n.forge.prng.err, n.forge.prng.bytes));
                        }),
                          self.postMessage({ forge: { prng: { needed: e } } });
                      })
                    : e.addEventListener("message", function (r) {
                        var n = r.data;
                        n.forge &&
                          n.forge.prng &&
                          t.seedFile(n.forge.prng.needed, function (t, r) {
                            e.postMessage({
                              forge: { prng: { err: t, bytes: r } },
                            });
                          });
                      });
                }),
                t
              );
            });
        }).call(this, e("_process"));
      },
      { "./forge": 16, "./util": 48, _process: 50, crypto: 6 },
    ],
    38: [
      function (e, t, r) {
        var n = e("./forge");
        e("./random"),
          e("./util"),
          ((t.exports = n.pss = n.pss || {}).create = function (e) {
            3 === arguments.length &&
              (e = {
                md: arguments[0],
                mgf: arguments[1],
                saltLength: arguments[2],
              });
            var t,
              r = e.md,
              i = e.mgf,
              a = r.digestLength,
              s = e.salt || null;
            if (
              ("string" == typeof s && (s = n.util.createBuffer(s)),
              "saltLength" in e)
            )
              t = e.saltLength;
            else {
              if (null === s)
                throw Error(
                  "Salt length not specified or specific salt not given."
                );
              t = s.length();
            }
            if (null !== s && s.length() !== t)
              throw Error(
                "Given salt length does not match length of given salt."
              );
            var o = e.prng || n.random;
            return {
              encode: function (e, c) {
                var u,
                  l,
                  _ = c - 1,
                  p = Math.ceil(_ / 8),
                  f = e.digest().getBytes();
                if (p < a + t + 2)
                  throw Error("Message is too long to encrypt.");
                l = null === s ? o.getBytesSync(t) : s.bytes();
                var h = new n.util.ByteBuffer();
                h.fillWithByte(0, 8),
                  h.putBytes(f),
                  h.putBytes(l),
                  r.start(),
                  r.update(h.getBytes());
                var d = r.digest().getBytes(),
                  $ = new n.util.ByteBuffer();
                $.fillWithByte(0, p - t - a - 2), $.putByte(1), $.putBytes(l);
                var g = $.getBytes(),
                  y = p - a - 1,
                  m = i.generate(d, y),
                  v = "";
                for (u = 0; u < y; u++)
                  v += String.fromCharCode(g.charCodeAt(u) ^ m.charCodeAt(u));
                return (
                  (v =
                    String.fromCharCode(
                      v.charCodeAt(0) & ~((65280 >> (8 * p - _)) & 255)
                    ) + v.substr(1)) +
                  d +
                  "\xbc"
                );
              },
              verify: function (e, s, o) {
                var c,
                  u = o - 1,
                  l = Math.ceil(u / 8);
                if (((s = s.substr(-l)), l < a + t + 2))
                  throw Error(
                    "Inconsistent parameters to PSS signature verification."
                  );
                if (188 !== s.charCodeAt(l - 1))
                  throw Error("Encoded message does not end in 0xBC.");
                var _ = l - a - 1,
                  p = s.substr(0, _),
                  f = s.substr(_, a),
                  h = (65280 >> (8 * l - u)) & 255;
                if (0 != (p.charCodeAt(0) & h))
                  throw Error("Bits beyond keysize not zero as expected.");
                var d = i.generate(f, _),
                  $ = "";
                for (c = 0; c < _; c++)
                  $ += String.fromCharCode(p.charCodeAt(c) ^ d.charCodeAt(c));
                $ = String.fromCharCode($.charCodeAt(0) & ~h) + $.substr(1);
                var g = l - a - t - 2;
                for (c = 0; c < g; c++)
                  if (0 !== $.charCodeAt(c))
                    throw Error("Leftmost octets not zero as expected");
                if (1 !== $.charCodeAt(g))
                  throw Error(
                    "Inconsistent PSS signature, 0x01 marker not found"
                  );
                var y = $.substr(-t),
                  m = new n.util.ByteBuffer();
                return (
                  m.fillWithByte(0, 8),
                  m.putBytes(e),
                  m.putBytes(y),
                  r.start(),
                  r.update(m.getBytes()),
                  f === r.digest().getBytes()
                );
              },
            };
          });
      },
      { "./forge": 16, "./random": 39, "./util": 48 },
    ],
    39: [
      function (e, t, r) {
        var n = e("./forge");
        e("./aes"),
          e("./sha256"),
          e("./prng"),
          e("./util"),
          n.random && n.random.getBytes
            ? (t.exports = n.random)
            : (function (e) {
                var r = {},
                  i = [, , , ,],
                  a = n.util.createBuffer();
                function s() {
                  var e = n.prng.create(r);
                  return (
                    (e.getBytes = function (t, r) {
                      return e.generate(t, r);
                    }),
                    (e.getBytesSync = function (t) {
                      return e.generate(t);
                    }),
                    e
                  );
                }
                (r.formatKey = function (e) {
                  var t = n.util.createBuffer(e);
                  return (
                    ((e = [, , , ,])[0] = t.getInt32()),
                    (e[1] = t.getInt32()),
                    (e[2] = t.getInt32()),
                    (e[3] = t.getInt32()),
                    n.aes._expandKey(e, !1)
                  );
                }),
                  (r.formatSeed = function (e) {
                    var t = n.util.createBuffer(e);
                    return (
                      ((e = [, , , ,])[0] = t.getInt32()),
                      (e[1] = t.getInt32()),
                      (e[2] = t.getInt32()),
                      (e[3] = t.getInt32()),
                      e
                    );
                  }),
                  (r.cipher = function (e, t) {
                    return (
                      n.aes._updateBlock(e, t, i, !1),
                      a.putInt32(i[0]),
                      a.putInt32(i[1]),
                      a.putInt32(i[2]),
                      a.putInt32(i[3]),
                      a.getBytes()
                    );
                  }),
                  (r.increment = function (e) {
                    return ++e[3], e;
                  }),
                  (r.md = n.md.sha256);
                var o = s(),
                  c = null,
                  u = n.util.globalScope,
                  l = u.crypto || u.msCrypto;
                if (
                  (l &&
                    l.getRandomValues &&
                    (c = function (e) {
                      return l.getRandomValues(e);
                    }),
                  n.options.usePureJavaScript || (!n.util.isNodejs && !c))
                ) {
                  if (
                    ("undefined" == typeof window || window.document,
                    o.collectInt(+new Date(), 32),
                    "undefined" != typeof navigator)
                  ) {
                    var _ = "";
                    for (var p in navigator)
                      try {
                        "string" == typeof navigator[p] && (_ += navigator[p]);
                      } catch (f) {}
                    o.collect(_), (_ = null);
                  }
                  e &&
                    (e().mousemove(function (e) {
                      o.collectInt(e.clientX, 16), o.collectInt(e.clientY, 16);
                    }),
                    e().keypress(function (e) {
                      o.collectInt(e.charCode, 8);
                    }));
                }
                if (n.random) for (var p in o) n.random[p] = o[p];
                else n.random = o;
                (n.random.createInstance = s), (t.exports = n.random);
              })("undefined" != typeof jQuery ? jQuery : null);
      },
      { "./aes": 7, "./forge": 16, "./prng": 37, "./sha256": 43, "./util": 48 },
    ],
    40: [
      function (e, t, r) {
        var n = e("./forge");
        e("./util");
        var i = [
            217, 120, 249, 196, 25, 221, 181, 237, 40, 233, 253, 121, 74, 160,
            216, 157, 198, 126, 55, 131, 43, 118, 83, 142, 98, 76, 100, 136, 68,
            139, 251, 162, 23, 154, 89, 245, 135, 179, 79, 19, 97, 69, 109, 141,
            9, 129, 125, 50, 189, 143, 64, 235, 134, 183, 123, 11, 240, 149, 33,
            34, 92, 107, 78, 130, 84, 214, 101, 147, 206, 96, 178, 28, 115, 86,
            192, 20, 167, 140, 241, 220, 18, 117, 202, 31, 59, 190, 228, 209,
            66, 61, 212, 48, 163, 60, 182, 38, 111, 191, 14, 218, 70, 105, 7,
            87, 39, 242, 29, 155, 188, 148, 67, 3, 248, 17, 199, 246, 144, 239,
            62, 231, 6, 195, 213, 47, 200, 102, 30, 215, 8, 232, 234, 222, 128,
            82, 238, 247, 132, 170, 114, 172, 53, 77, 106, 42, 150, 26, 210,
            113, 90, 21, 73, 116, 75, 159, 208, 94, 4, 24, 164, 236, 194, 224,
            65, 110, 15, 81, 203, 204, 36, 145, 175, 80, 161, 244, 112, 57, 153,
            124, 58, 133, 35, 184, 180, 122, 252, 2, 54, 91, 37, 85, 151, 49,
            45, 93, 250, 152, 227, 138, 146, 174, 5, 223, 41, 16, 103, 108, 186,
            201, 211, 0, 230, 207, 225, 158, 168, 44, 99, 22, 1, 63, 88, 226,
            137, 169, 13, 56, 52, 27, 171, 51, 255, 176, 187, 72, 12, 95, 185,
            177, 205, 46, 197, 243, 219, 71, 229, 165, 156, 119, 10, 166, 32,
            104, 254, 127, 193, 173,
          ],
          a = [1, 2, 3, 5];
        (t.exports = n.rc2 = n.rc2 || {}),
          (n.rc2.expandKey = function (e, t) {
            "string" == typeof e && (e = n.util.createBuffer(e)),
              (t = t || 128);
            var r,
              a = e,
              s = e.length(),
              o = t,
              c = Math.ceil(o / 8);
            for (r = s; r < 128; r++)
              a.putByte(i[(a.at(r - 1) + a.at(r - s)) & 255]);
            for (
              a.setAt(128 - c, i[a.at(128 - c) & (255 >> (7 & o))]),
                r = 127 - c;
              r >= 0;
              r--
            )
              a.setAt(r, i[a.at(r + 1) ^ a.at(r + c)]);
            return a;
          });
        var s = function (e, t, r) {
          var i,
            s,
            o,
            c,
            u = !1,
            l = null,
            _ = null,
            p = null,
            f = [];
          for (e = n.rc2.expandKey(e, t), o = 0; o < 64; o++)
            f.push(e.getInt16Le());
          r
            ? ((i = function (e) {
                var t, r;
                for (o = 0; o < 4; o++)
                  (e[o] +=
                    f[c] +
                    (e[(o + 3) % 4] & e[(o + 2) % 4]) +
                    (~e[(o + 3) % 4] & e[(o + 1) % 4])),
                    (e[o] =
                      (((t = e[o]) << (r = a[o])) & 65535) |
                      ((65535 & t) >> (16 - r))),
                    c++;
              }),
              (s = function (e) {
                for (o = 0; o < 4; o++) e[o] += f[63 & e[(o + 3) % 4]];
              }))
            : ((i = function (e) {
                var t, r;
                for (o = 3; o >= 0; o--)
                  (e[o] =
                    ((65535 & (t = e[o])) >> (r = a[o])) |
                    ((t << (16 - r)) & 65535)),
                    (e[o] -=
                      f[c] +
                      (e[(o + 3) % 4] & e[(o + 2) % 4]) +
                      (~e[(o + 3) % 4] & e[(o + 1) % 4])),
                    c--;
              }),
              (s = function (e) {
                for (o = 3; o >= 0; o--) e[o] -= f[63 & e[(o + 3) % 4]];
              }));
          var h = function (e) {
              var t = [];
              for (o = 0; o < 4; o++) {
                var n = l.getInt16Le();
                null !== p && (r ? (n ^= p.getInt16Le()) : p.putInt16Le(n)),
                  t.push(65535 & n);
              }
              c = r ? 0 : 63;
              for (var i = 0; i < e.length; i++)
                for (var a = 0; a < e[i][0]; a++) e[i][1](t);
              for (o = 0; o < 4; o++)
                null !== p &&
                  (r ? p.putInt16Le(t[o]) : (t[o] ^= p.getInt16Le())),
                  _.putInt16Le(t[o]);
            },
            d = null;
          return (d = {
            start: function (e, t) {
              e && "string" == typeof e && (e = n.util.createBuffer(e)),
                (u = !1),
                (l = n.util.createBuffer()),
                (_ = t || new n.util.createBuffer()),
                (p = e),
                (d.output = _);
            },
            update: function (e) {
              for (u || l.putBuffer(e); l.length() >= 8; )
                h([
                  [5, i],
                  [1, s],
                  [6, i],
                  [1, s],
                  [5, i],
                ]);
            },
            finish: function (e) {
              var t = !0;
              if (r) {
                if (e) t = e(8, l, !r);
                else {
                  var n = 8 === l.length() ? 8 : 8 - l.length();
                  l.fillWithByte(n, n);
                }
              }
              if ((t && ((u = !0), d.update()), !r && (t = 0 === l.length()))) {
                if (e) t = e(8, _, !r);
                else {
                  var i = _.length(),
                    a = _.at(i - 1);
                  a > i ? (t = !1) : _.truncate(a);
                }
              }
              return t;
            },
          });
        };
        (n.rc2.startEncrypting = function (e, t, r) {
          var i = n.rc2.createEncryptionCipher(e, 128);
          return i.start(t, r), i;
        }),
          (n.rc2.createEncryptionCipher = function (e, t) {
            return s(e, t, !0);
          }),
          (n.rc2.startDecrypting = function (e, t, r) {
            var i = n.rc2.createDecryptionCipher(e, 128);
            return i.start(t, r), i;
          }),
          (n.rc2.createDecryptionCipher = function (e, t) {
            return s(e, t, !1);
          });
      },
      { "./forge": 16, "./util": 48 },
    ],
    41: [
      function (e, t, r) {
        var n = e("./forge");
        if (
          (e("./asn1"),
          e("./jsbn"),
          e("./oids"),
          e("./pkcs1"),
          e("./prime"),
          e("./random"),
          e("./util"),
          void 0 === i)
        )
          var i = n.jsbn.BigInteger;
        var a = n.util.isNodejs ? e("crypto") : null,
          s = n.asn1,
          o = n.util;
        (n.pki = n.pki || {}), (t.exports = n.pki.rsa = n.rsa = n.rsa || {});
        var c = n.pki,
          u = [6, 4, 2, 4, 2, 4, 6, 2],
          l = {
            name: "PrivateKeyInfo",
            tagClass: s.Class.UNIVERSAL,
            type: s.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "PrivateKeyInfo.version",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.INTEGER,
                constructed: !1,
                capture: "privateKeyVersion",
              },
              {
                name: "PrivateKeyInfo.privateKeyAlgorithm",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.SEQUENCE,
                constructed: !0,
                value: [
                  {
                    name: "AlgorithmIdentifier.algorithm",
                    tagClass: s.Class.UNIVERSAL,
                    type: s.Type.OID,
                    constructed: !1,
                    capture: "privateKeyOid",
                  },
                ],
              },
              {
                name: "PrivateKeyInfo",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.OCTETSTRING,
                constructed: !1,
                capture: "privateKey",
              },
            ],
          },
          _ = {
            name: "RSAPrivateKey",
            tagClass: s.Class.UNIVERSAL,
            type: s.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "RSAPrivateKey.version",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.INTEGER,
                constructed: !1,
                capture: "privateKeyVersion",
              },
              {
                name: "RSAPrivateKey.modulus",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.INTEGER,
                constructed: !1,
                capture: "privateKeyModulus",
              },
              {
                name: "RSAPrivateKey.publicExponent",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.INTEGER,
                constructed: !1,
                capture: "privateKeyPublicExponent",
              },
              {
                name: "RSAPrivateKey.privateExponent",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.INTEGER,
                constructed: !1,
                capture: "privateKeyPrivateExponent",
              },
              {
                name: "RSAPrivateKey.prime1",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.INTEGER,
                constructed: !1,
                capture: "privateKeyPrime1",
              },
              {
                name: "RSAPrivateKey.prime2",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.INTEGER,
                constructed: !1,
                capture: "privateKeyPrime2",
              },
              {
                name: "RSAPrivateKey.exponent1",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.INTEGER,
                constructed: !1,
                capture: "privateKeyExponent1",
              },
              {
                name: "RSAPrivateKey.exponent2",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.INTEGER,
                constructed: !1,
                capture: "privateKeyExponent2",
              },
              {
                name: "RSAPrivateKey.coefficient",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.INTEGER,
                constructed: !1,
                capture: "privateKeyCoefficient",
              },
            ],
          },
          p = {
            name: "RSAPublicKey",
            tagClass: s.Class.UNIVERSAL,
            type: s.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "RSAPublicKey.modulus",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.INTEGER,
                constructed: !1,
                capture: "publicKeyModulus",
              },
              {
                name: "RSAPublicKey.exponent",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.INTEGER,
                constructed: !1,
                capture: "publicKeyExponent",
              },
            ],
          },
          f = (n.pki.rsa.publicKeyValidator = {
            name: "SubjectPublicKeyInfo",
            tagClass: s.Class.UNIVERSAL,
            type: s.Type.SEQUENCE,
            constructed: !0,
            captureAsn1: "subjectPublicKeyInfo",
            value: [
              {
                name: "SubjectPublicKeyInfo.AlgorithmIdentifier",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.SEQUENCE,
                constructed: !0,
                value: [
                  {
                    name: "AlgorithmIdentifier.algorithm",
                    tagClass: s.Class.UNIVERSAL,
                    type: s.Type.OID,
                    constructed: !1,
                    capture: "publicKeyOid",
                  },
                ],
              },
              {
                name: "SubjectPublicKeyInfo.subjectPublicKey",
                tagClass: s.Class.UNIVERSAL,
                type: s.Type.BITSTRING,
                constructed: !1,
                value: [
                  {
                    name: "SubjectPublicKeyInfo.subjectPublicKey.RSAPublicKey",
                    tagClass: s.Class.UNIVERSAL,
                    type: s.Type.SEQUENCE,
                    constructed: !0,
                    optional: !0,
                    captureAsn1: "rsaPublicKey",
                  },
                ],
              },
            ],
          }),
          h = function (e) {
            if (!(e.algorithm in c.oids)) {
              var t,
                r = Error("Unknown message digest algorithm.");
              throw ((r.algorithm = e.algorithm), r);
            }
            t = c.oids[e.algorithm];
            var n = s.oidToDer(t).getBytes(),
              i = s.create(s.Class.UNIVERSAL, s.Type.SEQUENCE, !0, []),
              a = s.create(s.Class.UNIVERSAL, s.Type.SEQUENCE, !0, []);
            a.value.push(s.create(s.Class.UNIVERSAL, s.Type.OID, !1, n)),
              a.value.push(s.create(s.Class.UNIVERSAL, s.Type.NULL, !1, ""));
            var o = s.create(
              s.Class.UNIVERSAL,
              s.Type.OCTETSTRING,
              !1,
              e.digest().getBytes()
            );
            return i.value.push(a), i.value.push(o), s.toDer(i).getBytes();
          },
          d = function (e, t, r) {
            if (r) return e.modPow(t.e, t.n);
            if (!t.p || !t.q) return e.modPow(t.d, t.n);
            t.dP || (t.dP = t.d.mod(t.p.subtract(i.ONE))),
              t.dQ || (t.dQ = t.d.mod(t.q.subtract(i.ONE))),
              t.qInv || (t.qInv = t.q.modInverse(t.p));
            do
              s = new i(
                n.util.bytesToHex(n.random.getBytes(t.n.bitLength() / 8)),
                16
              );
            while (s.compareTo(t.n) >= 0 || !s.gcd(t.n).equals(i.ONE));
            for (
              var a,
                s,
                o = (e = e.multiply(s.modPow(t.e, t.n)).mod(t.n))
                  .mod(t.p)
                  .modPow(t.dP, t.p),
                c = e.mod(t.q).modPow(t.dQ, t.q);
              0 > o.compareTo(c);

            )
              o = o.add(t.p);
            return o
              .subtract(c)
              .multiply(t.qInv)
              .mod(t.p)
              .multiply(t.q)
              .add(c)
              .multiply(s.modInverse(t.n))
              .mod(t.n);
          };
        function $(e, t, r) {
          var i = n.util.createBuffer(),
            a = Math.ceil(t.n.bitLength() / 8);
          if (e.length > a - 11) {
            var s = Error("Message is too long for PKCS#1 v1.5 padding.");
            throw ((s.length = e.length), (s.max = a - 11), s);
          }
          i.putByte(0), i.putByte(r);
          var o,
            c = a - 3 - e.length;
          if (0 === r || 1 === r) {
            o = 0 === r ? 0 : 255;
            for (var u = 0; u < c; ++u) i.putByte(o);
          } else
            for (; c > 0; ) {
              var l = 0,
                _ = n.random.getBytes(c);
              for (u = 0; u < c; ++u)
                0 === (o = _.charCodeAt(u)) ? ++l : i.putByte(o);
              c = l;
            }
          return i.putByte(0), i.putBytes(e), i;
        }
        function g(e, t, r, i) {
          var a = Math.ceil(t.n.bitLength() / 8),
            s = n.util.createBuffer(e),
            o = s.getByte(),
            c = s.getByte();
          if (
            0 !== o ||
            (r && 0 !== c && 1 !== c) ||
            (!r && 2 != c) ||
            (r && 0 === c && void 0 === i)
          )
            throw Error("Encryption block is invalid.");
          var u = 0;
          if (0 === c) {
            u = a - 3 - i;
            for (var l = 0; l < u; ++l)
              if (0 !== s.getByte())
                throw Error("Encryption block is invalid.");
          } else if (1 === c)
            for (u = 0; s.length() > 1; ) {
              if (255 !== s.getByte()) {
                --s.read;
                break;
              }
              ++u;
            }
          else if (2 === c)
            for (u = 0; s.length() > 1; ) {
              if (0 === s.getByte()) {
                --s.read;
                break;
              }
              ++u;
            }
          if (0 !== s.getByte() || u !== a - 3 - s.length())
            throw Error("Encryption block is invalid.");
          return s.getBytes();
        }
        function y(e) {
          var t = e.toString(16);
          t[0] >= "8" && (t = "00" + t);
          var r = n.util.hexToBytes(t);
          return r.length > 1 &&
            ((0 === r.charCodeAt(0) && 0 == (128 & r.charCodeAt(1))) ||
              (255 === r.charCodeAt(0) && 128 == (128 & r.charCodeAt(1))))
            ? r.substr(1)
            : r;
        }
        function m(e) {
          return e <= 100
            ? 27
            : e <= 150
            ? 18
            : e <= 200
            ? 15
            : e <= 250
            ? 12
            : e <= 300
            ? 9
            : e <= 350
            ? 8
            : e <= 400
            ? 7
            : e <= 500
            ? 6
            : e <= 600
            ? 5
            : e <= 800
            ? 4
            : e <= 1250
            ? 3
            : 2;
        }
        function v(e) {
          return n.util.isNodejs && "function" == typeof a[e];
        }
        function C(e) {
          return (
            void 0 !== o.globalScope &&
            "object" == typeof o.globalScope.crypto &&
            "object" == typeof o.globalScope.crypto.subtle &&
            "function" == typeof o.globalScope.crypto.subtle[e]
          );
        }
        function E(e) {
          return (
            void 0 !== o.globalScope &&
            "object" == typeof o.globalScope.msCrypto &&
            "object" == typeof o.globalScope.msCrypto.subtle &&
            "function" == typeof o.globalScope.msCrypto.subtle[e]
          );
        }
        function S(e) {
          for (
            var t = n.util.hexToBytes(e.toString(16)),
              r = new Uint8Array(t.length),
              i = 0;
            i < t.length;
            ++i
          )
            r[i] = t.charCodeAt(i);
          return r;
        }
        (c.rsa.encrypt = function (e, t, r) {
          var a,
            s = r,
            o = Math.ceil(t.n.bitLength() / 8);
          !1 !== r && !0 !== r
            ? ((s = 2 === r), (a = $(e, t, r)))
            : (a = n.util.createBuffer()).putBytes(e);
          for (
            var c = new i(a.toHex(), 16),
              u = d(c, t, s).toString(16),
              l = n.util.createBuffer(),
              _ = o - Math.ceil(u.length / 2);
            _ > 0;

          )
            l.putByte(0), --_;
          return l.putBytes(n.util.hexToBytes(u)), l.getBytes();
        }),
          (c.rsa.decrypt = function (e, t, r, a) {
            var s = Math.ceil(t.n.bitLength() / 8);
            if (e.length !== s) {
              var o = Error("Encrypted message length is invalid.");
              throw ((o.length = e.length), (o.expected = s), o);
            }
            var c = new i(n.util.createBuffer(e).toHex(), 16);
            if (c.compareTo(t.n) >= 0)
              throw Error("Encrypted message is invalid.");
            for (
              var u = d(c, t, r).toString(16),
                l = n.util.createBuffer(),
                _ = s - Math.ceil(u.length / 2);
              _ > 0;

            )
              l.putByte(0), --_;
            return (
              l.putBytes(n.util.hexToBytes(u)),
              !1 !== a ? g(l.getBytes(), t, r) : l.getBytes()
            );
          }),
          (c.rsa.createKeyPairGenerationState = function (e, t, r) {
            "string" == typeof e && (e = parseInt(e, 10)), (e = e || 2048);
            var a,
              s = (r = r || {}).prng || n.random,
              o = r.algorithm || "PRIMEINC";
            if ("PRIMEINC" !== o)
              throw Error("Invalid key generation algorithm: " + o);
            return (
              (a = {
                algorithm: o,
                state: 0,
                bits: e,
                rng: {
                  nextBytes: function (e) {
                    for (
                      var t = s.getBytesSync(e.length), r = 0;
                      r < e.length;
                      ++r
                    )
                      e[r] = t.charCodeAt(r);
                  },
                },
                eInt: t || 65537,
                e: new i(null),
                p: null,
                q: null,
                qBits: e >> 1,
                pBits: e - (e >> 1),
                pqState: 0,
                num: null,
                keys: null,
              }).e.fromInt(a.eInt),
              a
            );
          }),
          (c.rsa.stepKeyPairGenerationState = function (e, t) {
            "algorithm" in e || (e.algorithm = "PRIMEINC");
            var r = new i(null);
            r.fromInt(30);
            for (
              var n,
                a = 0,
                s = function (e, t) {
                  return e | t;
                },
                o = +new Date(),
                l = 0;
              null === e.keys && (t <= 0 || l < t);

            ) {
              if (0 === e.state) {
                var _ = null === e.p ? e.pBits : e.qBits,
                  p = _ - 1;
                0 === e.pqState
                  ? ((e.num = new i(_, e.rng)),
                    e.num.testBit(p) ||
                      e.num.bitwiseTo(i.ONE.shiftLeft(p), s, e.num),
                    e.num.dAddOffset(31 - e.num.mod(r).byteValue(), 0),
                    (a = 0),
                    ++e.pqState)
                  : 1 === e.pqState
                  ? e.num.bitLength() > _
                    ? (e.pqState = 0)
                    : e.num.isProbablePrime(m(e.num.bitLength()))
                    ? ++e.pqState
                    : e.num.dAddOffset(u[a++ % 8], 0)
                  : 2 === e.pqState
                  ? (e.pqState =
                      0 === e.num.subtract(i.ONE).gcd(e.e).compareTo(i.ONE)
                        ? 3
                        : 0)
                  : 3 === e.pqState &&
                    ((e.pqState = 0),
                    null === e.p ? (e.p = e.num) : (e.q = e.num),
                    null !== e.p && null !== e.q && ++e.state,
                    (e.num = null));
              } else if (1 === e.state)
                0 > e.p.compareTo(e.q) &&
                  ((e.num = e.p), (e.p = e.q), (e.q = e.num)),
                  ++e.state;
              else if (2 === e.state)
                (e.p1 = e.p.subtract(i.ONE)),
                  (e.q1 = e.q.subtract(i.ONE)),
                  (e.phi = e.p1.multiply(e.q1)),
                  ++e.state;
              else if (3 === e.state)
                0 === e.phi.gcd(e.e).compareTo(i.ONE)
                  ? ++e.state
                  : ((e.p = null), (e.q = null), (e.state = 0));
              else if (4 === e.state)
                (e.n = e.p.multiply(e.q)),
                  e.n.bitLength() === e.bits
                    ? ++e.state
                    : ((e.q = null), (e.state = 0));
              else if (5 === e.state) {
                var f = e.e.modInverse(e.phi);
                e.keys = {
                  privateKey: c.rsa.setPrivateKey(
                    e.n,
                    e.e,
                    f,
                    e.p,
                    e.q,
                    f.mod(e.p1),
                    f.mod(e.q1),
                    e.q.modInverse(e.p)
                  ),
                  publicKey: c.rsa.setPublicKey(e.n, e.e),
                };
              }
              (l += (n = +new Date()) - o), (o = n);
            }
            return null !== e.keys;
          }),
          (c.rsa.generateKeyPair = function (e, t, r, u) {
            if (
              (1 === arguments.length
                ? "object" == typeof e
                  ? ((r = e), (e = void 0))
                  : "function" == typeof e && ((u = e), (e = void 0))
                : 2 === arguments.length
                ? "number" == typeof e
                  ? "function" == typeof t
                    ? ((u = t), (t = void 0))
                    : "number" != typeof t && ((r = t), (t = void 0))
                  : ((r = e), (u = t), (e = void 0), (t = void 0))
                : 3 === arguments.length &&
                  ("number" == typeof t
                    ? "function" == typeof r && ((u = r), (r = void 0))
                    : ((u = r), (r = t), (t = void 0))),
              (r = r || {}),
              void 0 === e && (e = r.bits || 2048),
              void 0 === t && (t = r.e || 65537),
              !n.options.usePureJavaScript &&
                !r.prng &&
                e >= 256 &&
                e <= 16384 &&
                (65537 === t || 3 === t))
            ) {
              if (u) {
                if (v("generateKeyPair"))
                  return a.generateKeyPair(
                    "rsa",
                    {
                      modulusLength: e,
                      publicExponent: t,
                      publicKeyEncoding: { type: "spki", format: "pem" },
                      privateKeyEncoding: { type: "pkcs8", format: "pem" },
                    },
                    function (e, t, r) {
                      if (e) return u(e);
                      u(null, {
                        privateKey: c.privateKeyFromPem(r),
                        publicKey: c.publicKeyFromPem(t),
                      });
                    }
                  );
                if (C("generateKey") && C("exportKey"))
                  return o.globalScope.crypto.subtle
                    .generateKey(
                      {
                        name: "RSASSA-PKCS1-v1_5",
                        modulusLength: e,
                        publicExponent: S(t),
                        hash: { name: "SHA-256" },
                      },
                      !0,
                      ["sign", "verify"]
                    )
                    .then(function (e) {
                      return o.globalScope.crypto.subtle.exportKey(
                        "pkcs8",
                        e.privateKey
                      );
                    })
                    .then(void 0, function (e) {
                      u(e);
                    })
                    .then(function (e) {
                      if (e) {
                        var t = c.privateKeyFromAsn1(
                          s.fromDer(n.util.createBuffer(e))
                        );
                        u(null, {
                          privateKey: t,
                          publicKey: c.setRsaPublicKey(t.n, t.e),
                        });
                      }
                    });
                if (E("generateKey") && E("exportKey")) {
                  var l = o.globalScope.msCrypto.subtle.generateKey(
                    {
                      name: "RSASSA-PKCS1-v1_5",
                      modulusLength: e,
                      publicExponent: S(t),
                      hash: { name: "SHA-256" },
                    },
                    !0,
                    ["sign", "verify"]
                  );
                  return (
                    (l.oncomplete = function (e) {
                      var t = e.target.result,
                        r = o.globalScope.msCrypto.subtle.exportKey(
                          "pkcs8",
                          t.privateKey
                        );
                      (r.oncomplete = function (e) {
                        var t = e.target.result,
                          r = c.privateKeyFromAsn1(
                            s.fromDer(n.util.createBuffer(t))
                          );
                        u(null, {
                          privateKey: r,
                          publicKey: c.setRsaPublicKey(r.n, r.e),
                        });
                      }),
                        (r.onerror = function (e) {
                          u(e);
                        });
                    }),
                    void (l.onerror = function (e) {
                      u(e);
                    })
                  );
                }
              } else if (v("generateKeyPairSync")) {
                var _ = a.generateKeyPairSync("rsa", {
                  modulusLength: e,
                  publicExponent: t,
                  publicKeyEncoding: { type: "spki", format: "pem" },
                  privateKeyEncoding: { type: "pkcs8", format: "pem" },
                });
                return {
                  privateKey: c.privateKeyFromPem(_.privateKey),
                  publicKey: c.publicKeyFromPem(_.publicKey),
                };
              }
            }
            var p = c.rsa.createKeyPairGenerationState(e, t, r);
            if (!u) return c.rsa.stepKeyPairGenerationState(p, 0), p.keys;
            !(function (e, t, r) {
              "function" == typeof t && ((r = t), (t = {}));
              var a = {
                algorithm: {
                  name: (t = t || {}).algorithm || "PRIMEINC",
                  options: {
                    workers: t.workers || 2,
                    workLoad: t.workLoad || 100,
                    workerScript: t.workerScript,
                  },
                },
              };
              function s() {
                o(e.pBits, function (t, n) {
                  return t
                    ? r(t)
                    : ((e.p = n),
                      null !== e.q ? u(t, e.q) : void o(e.qBits, u));
                });
              }
              function o(e, t) {
                n.prime.generateProbablePrime(e, a, t);
              }
              function u(t, n) {
                if (t) return r(t);
                if (((e.q = n), 0 > e.p.compareTo(e.q))) {
                  var a = e.p;
                  (e.p = e.q), (e.q = a);
                }
                if (0 !== e.p.subtract(i.ONE).gcd(e.e).compareTo(i.ONE))
                  return (e.p = null), void s();
                if (0 !== e.q.subtract(i.ONE).gcd(e.e).compareTo(i.ONE))
                  return (e.q = null), void o(e.qBits, u);
                if (
                  ((e.p1 = e.p.subtract(i.ONE)),
                  (e.q1 = e.q.subtract(i.ONE)),
                  (e.phi = e.p1.multiply(e.q1)),
                  0 !== e.phi.gcd(e.e).compareTo(i.ONE))
                )
                  return (e.p = e.q = null), void s();
                if (((e.n = e.p.multiply(e.q)), e.n.bitLength() !== e.bits))
                  return (e.q = null), void o(e.qBits, u);
                var l = e.e.modInverse(e.phi);
                (e.keys = {
                  privateKey: c.rsa.setPrivateKey(
                    e.n,
                    e.e,
                    l,
                    e.p,
                    e.q,
                    l.mod(e.p1),
                    l.mod(e.q1),
                    e.q.modInverse(e.p)
                  ),
                  publicKey: c.rsa.setPublicKey(e.n, e.e),
                }),
                  r(null, e.keys);
              }
              "prng" in t && (a.prng = t.prng), s();
            })(p, r, u);
          }),
          (c.setRsaPublicKey = c.rsa.setPublicKey =
            function (e, t) {
              var r = {
                n: e,
                e: t,
                encrypt: function (e, t, i) {
                  if (
                    ("string" == typeof t
                      ? (t = t.toUpperCase())
                      : void 0 === t && (t = "RSAES-PKCS1-V1_5"),
                    "RSAES-PKCS1-V1_5" === t)
                  )
                    t = {
                      encode: function (e, t, r) {
                        return $(e, t, 2).getBytes();
                      },
                    };
                  else if ("RSA-OAEP" === t || "RSAES-OAEP" === t)
                    t = {
                      encode: function (e, t) {
                        return n.pkcs1.encode_rsa_oaep(t, e, i);
                      },
                    };
                  else if (-1 !== ["RAW", "NONE", "NULL", null].indexOf(t))
                    t = {
                      encode: function (e) {
                        return e;
                      },
                    };
                  else if ("string" == typeof t)
                    throw Error('Unsupported encryption scheme: "' + t + '".');
                  var a = t.encode(e, r, !0);
                  return c.rsa.encrypt(a, r, !0);
                },
                verify: function (e, t, n) {
                  "string" == typeof n
                    ? (n = n.toUpperCase())
                    : void 0 === n && (n = "RSASSA-PKCS1-V1_5"),
                    "RSASSA-PKCS1-V1_5" === n
                      ? (n = {
                          verify: function (e, t) {
                            return (
                              (t = g(t, r, !0)),
                              e === s.fromDer(t).value[1].value
                            );
                          },
                        })
                      : ("NONE" !== n && "NULL" !== n && null !== n) ||
                        (n = {
                          verify: function (e, t) {
                            return e === (t = g(t, r, !0));
                          },
                        });
                  var i = c.rsa.decrypt(t, r, !0, !1);
                  return n.verify(e, i, r.n.bitLength());
                },
              };
              return r;
            }),
          (c.setRsaPrivateKey = c.rsa.setPrivateKey =
            function (e, t, r, i, a, s, o, u) {
              var l = {
                n: e,
                e: t,
                d: r,
                p: i,
                q: a,
                dP: s,
                dQ: o,
                qInv: u,
                decrypt: function (e, t, r) {
                  "string" == typeof t
                    ? (t = t.toUpperCase())
                    : void 0 === t && (t = "RSAES-PKCS1-V1_5");
                  var i = c.rsa.decrypt(e, l, !1, !1);
                  if ("RSAES-PKCS1-V1_5" === t) t = { decode: g };
                  else if ("RSA-OAEP" === t || "RSAES-OAEP" === t)
                    t = {
                      decode: function (e, t) {
                        return n.pkcs1.decode_rsa_oaep(t, e, r);
                      },
                    };
                  else {
                    if (-1 === ["RAW", "NONE", "NULL", null].indexOf(t))
                      throw Error(
                        'Unsupported encryption scheme: "' + t + '".'
                      );
                    t = {
                      decode: function (e) {
                        return e;
                      },
                    };
                  }
                  return t.decode(i, l, !1);
                },
                sign: function (e, t) {
                  var r = !1;
                  "string" == typeof t && (t = t.toUpperCase()),
                    void 0 === t || "RSASSA-PKCS1-V1_5" === t
                      ? ((t = { encode: h }), (r = 1))
                      : ("NONE" !== t && "NULL" !== t && null !== t) ||
                        ((t = {
                          encode: function () {
                            return e;
                          },
                        }),
                        (r = 1));
                  var n = t.encode(e, l.n.bitLength());
                  return c.rsa.encrypt(n, l, r);
                },
              };
              return l;
            }),
          (c.wrapRsaPrivateKey = function (e) {
            return s.create(s.Class.UNIVERSAL, s.Type.SEQUENCE, !0, [
              s.create(
                s.Class.UNIVERSAL,
                s.Type.INTEGER,
                !1,
                s.integerToDer(0).getBytes()
              ),
              s.create(s.Class.UNIVERSAL, s.Type.SEQUENCE, !0, [
                s.create(
                  s.Class.UNIVERSAL,
                  s.Type.OID,
                  !1,
                  s.oidToDer(c.oids.rsaEncryption).getBytes()
                ),
                s.create(s.Class.UNIVERSAL, s.Type.NULL, !1, ""),
              ]),
              s.create(
                s.Class.UNIVERSAL,
                s.Type.OCTETSTRING,
                !1,
                s.toDer(e).getBytes()
              ),
            ]);
          }),
          (c.privateKeyFromAsn1 = function (e) {
            var t,
              r,
              a,
              o,
              u,
              p,
              f,
              h,
              d = {},
              $ = [];
            if (
              (s.validate(e, l, d, $) &&
                (e = s.fromDer(n.util.createBuffer(d.privateKey))),
              (d = {}),
              ($ = []),
              !s.validate(e, _, d, $))
            ) {
              var g = Error(
                "Cannot read private key. ASN.1 object does not contain an RSAPrivateKey."
              );
              throw ((g.errors = $), g);
            }
            return (
              (t = n.util.createBuffer(d.privateKeyModulus).toHex()),
              (r = n.util.createBuffer(d.privateKeyPublicExponent).toHex()),
              (a = n.util.createBuffer(d.privateKeyPrivateExponent).toHex()),
              (o = n.util.createBuffer(d.privateKeyPrime1).toHex()),
              (u = n.util.createBuffer(d.privateKeyPrime2).toHex()),
              (p = n.util.createBuffer(d.privateKeyExponent1).toHex()),
              (f = n.util.createBuffer(d.privateKeyExponent2).toHex()),
              (h = n.util.createBuffer(d.privateKeyCoefficient).toHex()),
              c.setRsaPrivateKey(
                new i(t, 16),
                new i(r, 16),
                new i(a, 16),
                new i(o, 16),
                new i(u, 16),
                new i(p, 16),
                new i(f, 16),
                new i(h, 16)
              )
            );
          }),
          (c.privateKeyToAsn1 = c.privateKeyToRSAPrivateKey =
            function (e) {
              return s.create(s.Class.UNIVERSAL, s.Type.SEQUENCE, !0, [
                s.create(
                  s.Class.UNIVERSAL,
                  s.Type.INTEGER,
                  !1,
                  s.integerToDer(0).getBytes()
                ),
                s.create(s.Class.UNIVERSAL, s.Type.INTEGER, !1, y(e.n)),
                s.create(s.Class.UNIVERSAL, s.Type.INTEGER, !1, y(e.e)),
                s.create(s.Class.UNIVERSAL, s.Type.INTEGER, !1, y(e.d)),
                s.create(s.Class.UNIVERSAL, s.Type.INTEGER, !1, y(e.p)),
                s.create(s.Class.UNIVERSAL, s.Type.INTEGER, !1, y(e.q)),
                s.create(s.Class.UNIVERSAL, s.Type.INTEGER, !1, y(e.dP)),
                s.create(s.Class.UNIVERSAL, s.Type.INTEGER, !1, y(e.dQ)),
                s.create(s.Class.UNIVERSAL, s.Type.INTEGER, !1, y(e.qInv)),
              ]);
            }),
          (c.publicKeyFromAsn1 = function (e) {
            var t = {},
              r = [];
            if (s.validate(e, f, t, r)) {
              var a,
                o = s.derToOid(t.publicKeyOid);
              if (o !== c.oids.rsaEncryption)
                throw (
                  (((a = Error("Cannot read public key. Unknown OID.")).oid =
                    o),
                  a)
                );
              e = t.rsaPublicKey;
            }
            if (((r = []), !s.validate(e, p, t, r)))
              throw (
                (((a = Error(
                  "Cannot read public key. ASN.1 object does not contain an RSAPublicKey."
                )).errors = r),
                a)
              );
            var u = n.util.createBuffer(t.publicKeyModulus).toHex(),
              l = n.util.createBuffer(t.publicKeyExponent).toHex();
            return c.setRsaPublicKey(new i(u, 16), new i(l, 16));
          }),
          (c.publicKeyToAsn1 = c.publicKeyToSubjectPublicKeyInfo =
            function (e) {
              return s.create(s.Class.UNIVERSAL, s.Type.SEQUENCE, !0, [
                s.create(s.Class.UNIVERSAL, s.Type.SEQUENCE, !0, [
                  s.create(
                    s.Class.UNIVERSAL,
                    s.Type.OID,
                    !1,
                    s.oidToDer(c.oids.rsaEncryption).getBytes()
                  ),
                  s.create(s.Class.UNIVERSAL, s.Type.NULL, !1, ""),
                ]),
                s.create(s.Class.UNIVERSAL, s.Type.BITSTRING, !1, [
                  c.publicKeyToRSAPublicKey(e),
                ]),
              ]);
            }),
          (c.publicKeyToRSAPublicKey = function (e) {
            return s.create(s.Class.UNIVERSAL, s.Type.SEQUENCE, !0, [
              s.create(s.Class.UNIVERSAL, s.Type.INTEGER, !1, y(e.n)),
              s.create(s.Class.UNIVERSAL, s.Type.INTEGER, !1, y(e.e)),
            ]);
          });
      },
      {
        "./asn1": 9,
        "./forge": 16,
        "./jsbn": 19,
        "./oids": 27,
        "./pkcs1": 31,
        "./prime": 36,
        "./random": 39,
        "./util": 48,
        crypto: 6,
      },
    ],
    42: [
      function (e, t, r) {
        var n = e("./forge");
        e("./md"), e("./util");
        var i = (t.exports = n.sha1 = n.sha1 || {});
        (n.md.sha1 = n.md.algorithms.sha1 = i),
          (i.create = function () {
            s || ((a = "\x80"), (a += n.util.fillString("\0", 64)), (s = !0));
            var e = null,
              t = n.util.createBuffer(),
              r = Array(80),
              i = {
                algorithm: "sha1",
                blockLength: 64,
                digestLength: 20,
                messageLength: 0,
                fullMessageLength: null,
                messageLengthSize: 8,
                start: function () {
                  (i.messageLength = 0),
                    (i.fullMessageLength = i.messageLength64 = []);
                  for (var r = i.messageLengthSize / 4, a = 0; a < r; ++a)
                    i.fullMessageLength.push(0);
                  return (
                    (t = n.util.createBuffer()),
                    (e = {
                      h0: 1732584193,
                      h1: 4023233417,
                      h2: 2562383102,
                      h3: 271733878,
                      h4: 3285377520,
                    }),
                    i
                  );
                },
              };
            return (
              i.start(),
              (i.update = function (a, s) {
                "utf8" === s && (a = n.util.encodeUtf8(a));
                var c = a.length;
                (i.messageLength += c), (c = [(c / 4294967296) >>> 0, c >>> 0]);
                for (var u = i.fullMessageLength.length - 1; u >= 0; --u)
                  (i.fullMessageLength[u] += c[1]),
                    (c[1] =
                      c[0] + ((i.fullMessageLength[u] / 4294967296) >>> 0)),
                    (i.fullMessageLength[u] = i.fullMessageLength[u] >>> 0),
                    (c[0] = (c[1] / 4294967296) >>> 0);
                return (
                  t.putBytes(a),
                  o(e, r, t),
                  (t.read > 2048 || 0 === t.length()) && t.compact(),
                  i
                );
              }),
              (i.digest = function () {
                var s = n.util.createBuffer();
                s.putBytes(t.bytes());
                var c,
                  u =
                    (i.fullMessageLength[i.fullMessageLength.length - 1] +
                      i.messageLengthSize) &
                    (i.blockLength - 1);
                s.putBytes(a.substr(0, i.blockLength - u));
                for (
                  var l = 8 * i.fullMessageLength[0], _ = 0;
                  _ < i.fullMessageLength.length - 1;
                  ++_
                )
                  (l +=
                    ((c = 8 * i.fullMessageLength[_ + 1]) / 4294967296) >>> 0),
                    s.putInt32(l >>> 0),
                    (l = c >>> 0);
                s.putInt32(l);
                var p = { h0: e.h0, h1: e.h1, h2: e.h2, h3: e.h3, h4: e.h4 };
                o(p, r, s);
                var f = n.util.createBuffer();
                return (
                  f.putInt32(p.h0),
                  f.putInt32(p.h1),
                  f.putInt32(p.h2),
                  f.putInt32(p.h3),
                  f.putInt32(p.h4),
                  f
                );
              }),
              i
            );
          });
        var a = null,
          s = !1;
        function o(e, t, r) {
          for (var n, i, a, s, o, c, u, l = r.length(); l >= 64; ) {
            for (
              i = e.h0, a = e.h1, s = e.h2, o = e.h3, c = e.h4, u = 0;
              u < 16;
              ++u
            )
              (n = r.getInt32()),
                (t[u] = n),
                (n =
                  ((i << 5) | (i >>> 27)) +
                  (o ^ (a & (s ^ o))) +
                  c +
                  1518500249 +
                  n),
                (c = o),
                (o = s),
                (s = ((a << 30) | (a >>> 2)) >>> 0),
                (a = i),
                (i = n);
            for (; u < 20; ++u)
              (n =
                ((n = t[u - 3] ^ t[u - 8] ^ t[u - 14] ^ t[u - 16]) << 1) |
                (n >>> 31)),
                (t[u] = n),
                (n =
                  ((i << 5) | (i >>> 27)) +
                  (o ^ (a & (s ^ o))) +
                  c +
                  1518500249 +
                  n),
                (c = o),
                (o = s),
                (s = ((a << 30) | (a >>> 2)) >>> 0),
                (a = i),
                (i = n);
            for (; u < 32; ++u)
              (n =
                ((n = t[u - 3] ^ t[u - 8] ^ t[u - 14] ^ t[u - 16]) << 1) |
                (n >>> 31)),
                (t[u] = n),
                (n =
                  ((i << 5) | (i >>> 27)) + (a ^ s ^ o) + c + 1859775393 + n),
                (c = o),
                (o = s),
                (s = ((a << 30) | (a >>> 2)) >>> 0),
                (a = i),
                (i = n);
            for (; u < 40; ++u)
              (n =
                ((n = t[u - 6] ^ t[u - 16] ^ t[u - 28] ^ t[u - 32]) << 2) |
                (n >>> 30)),
                (t[u] = n),
                (n =
                  ((i << 5) | (i >>> 27)) + (a ^ s ^ o) + c + 1859775393 + n),
                (c = o),
                (o = s),
                (s = ((a << 30) | (a >>> 2)) >>> 0),
                (a = i),
                (i = n);
            for (; u < 60; ++u)
              (n =
                ((n = t[u - 6] ^ t[u - 16] ^ t[u - 28] ^ t[u - 32]) << 2) |
                (n >>> 30)),
                (t[u] = n),
                (n =
                  ((i << 5) | (i >>> 27)) +
                  ((a & s) | (o & (a ^ s))) +
                  c +
                  2400959708 +
                  n),
                (c = o),
                (o = s),
                (s = ((a << 30) | (a >>> 2)) >>> 0),
                (a = i),
                (i = n);
            for (; u < 80; ++u)
              (n =
                ((n = t[u - 6] ^ t[u - 16] ^ t[u - 28] ^ t[u - 32]) << 2) |
                (n >>> 30)),
                (t[u] = n),
                (n =
                  ((i << 5) | (i >>> 27)) + (a ^ s ^ o) + c + 3395469782 + n),
                (c = o),
                (o = s),
                (s = ((a << 30) | (a >>> 2)) >>> 0),
                (a = i),
                (i = n);
            (e.h0 = (e.h0 + i) | 0),
              (e.h1 = (e.h1 + a) | 0),
              (e.h2 = (e.h2 + s) | 0),
              (e.h3 = (e.h3 + o) | 0),
              (e.h4 = (e.h4 + c) | 0),
              (l -= 64);
          }
        }
      },
      { "./forge": 16, "./md": 23, "./util": 48 },
    ],
    43: [
      function (e, t, r) {
        var n = e("./forge");
        e("./md"), e("./util");
        var i = (t.exports = n.sha256 = n.sha256 || {});
        (n.md.sha256 = n.md.algorithms.sha256 = i),
          (i.create = function () {
            s ||
              ((a = "\x80"),
              (a += n.util.fillString("\0", 64)),
              (o = [
                1116352408, 1899447441, 3049323471, 3921009573, 961987163,
                1508970993, 2453635748, 2870763221, 3624381080, 310598401,
                607225278, 1426881987, 1925078388, 2162078206, 2614888103,
                3248222580, 3835390401, 4022224774, 264347078, 604807628,
                770255983, 1249150122, 1555081692, 1996064986, 2554220882,
                2821834349, 2952996808, 3210313671, 3336571891, 3584528711,
                113926993, 338241895, 666307205, 773529912, 1294757372,
                1396182291, 1695183700, 1986661051, 2177026350, 2456956037,
                2730485921, 2820302411, 3259730800, 3345764771, 3516065817,
                3600352804, 4094571909, 275423344, 430227734, 506948616,
                659060556, 883997877, 958139571, 1322822218, 1537002063,
                1747873779, 1955562222, 2024104815, 2227730452, 2361852424,
                2428436474, 2756734187, 3204031479, 3329325298,
              ]),
              (s = !0));
            var e = null,
              t = n.util.createBuffer(),
              r = Array(64),
              i = {
                algorithm: "sha256",
                blockLength: 64,
                digestLength: 32,
                messageLength: 0,
                fullMessageLength: null,
                messageLengthSize: 8,
                start: function () {
                  (i.messageLength = 0),
                    (i.fullMessageLength = i.messageLength64 = []);
                  for (var r = i.messageLengthSize / 4, a = 0; a < r; ++a)
                    i.fullMessageLength.push(0);
                  return (
                    (t = n.util.createBuffer()),
                    (e = {
                      h0: 1779033703,
                      h1: 3144134277,
                      h2: 1013904242,
                      h3: 2773480762,
                      h4: 1359893119,
                      h5: 2600822924,
                      h6: 528734635,
                      h7: 1541459225,
                    }),
                    i
                  );
                },
              };
            return (
              i.start(),
              (i.update = function (a, s) {
                "utf8" === s && (a = n.util.encodeUtf8(a));
                var o = a.length;
                (i.messageLength += o), (o = [(o / 4294967296) >>> 0, o >>> 0]);
                for (var u = i.fullMessageLength.length - 1; u >= 0; --u)
                  (i.fullMessageLength[u] += o[1]),
                    (o[1] =
                      o[0] + ((i.fullMessageLength[u] / 4294967296) >>> 0)),
                    (i.fullMessageLength[u] = i.fullMessageLength[u] >>> 0),
                    (o[0] = (o[1] / 4294967296) >>> 0);
                return (
                  t.putBytes(a),
                  c(e, r, t),
                  (t.read > 2048 || 0 === t.length()) && t.compact(),
                  i
                );
              }),
              (i.digest = function () {
                var s = n.util.createBuffer();
                s.putBytes(t.bytes());
                var o,
                  u =
                    (i.fullMessageLength[i.fullMessageLength.length - 1] +
                      i.messageLengthSize) &
                    (i.blockLength - 1);
                s.putBytes(a.substr(0, i.blockLength - u));
                for (
                  var l = 8 * i.fullMessageLength[0], _ = 0;
                  _ < i.fullMessageLength.length - 1;
                  ++_
                )
                  (l +=
                    ((o = 8 * i.fullMessageLength[_ + 1]) / 4294967296) >>> 0),
                    s.putInt32(l >>> 0),
                    (l = o >>> 0);
                s.putInt32(l);
                var p = {
                  h0: e.h0,
                  h1: e.h1,
                  h2: e.h2,
                  h3: e.h3,
                  h4: e.h4,
                  h5: e.h5,
                  h6: e.h6,
                  h7: e.h7,
                };
                c(p, r, s);
                var f = n.util.createBuffer();
                return (
                  f.putInt32(p.h0),
                  f.putInt32(p.h1),
                  f.putInt32(p.h2),
                  f.putInt32(p.h3),
                  f.putInt32(p.h4),
                  f.putInt32(p.h5),
                  f.putInt32(p.h6),
                  f.putInt32(p.h7),
                  f
                );
              }),
              i
            );
          });
        var a = null,
          s = !1,
          o = null;
        function c(e, t, r) {
          for (
            var n, i, a, s, c, u, l, _, p, f, h, d, $, g = r.length();
            g >= 64;

          ) {
            for (c = 0; c < 16; ++c) t[c] = r.getInt32();
            for (; c < 64; ++c)
              (n =
                (((n = t[c - 2]) >>> 17) | (n << 15)) ^
                ((n >>> 19) | (n << 13)) ^
                (n >>> 10)),
                (i =
                  (((i = t[c - 15]) >>> 7) | (i << 25)) ^
                  ((i >>> 18) | (i << 14)) ^
                  (i >>> 3)),
                (t[c] = (n + t[c - 7] + i + t[c - 16]) | 0);
            for (
              u = e.h0,
                l = e.h1,
                _ = e.h2,
                p = e.h3,
                f = e.h4,
                h = e.h5,
                d = e.h6,
                $ = e.h7,
                c = 0;
              c < 64;
              ++c
            )
              (a =
                ((u >>> 2) | (u << 30)) ^
                ((u >>> 13) | (u << 19)) ^
                ((u >>> 22) | (u << 10))),
                (s = (u & l) | (_ & (u ^ l))),
                (n =
                  $ +
                  (((f >>> 6) | (f << 26)) ^
                    ((f >>> 11) | (f << 21)) ^
                    ((f >>> 25) | (f << 7))) +
                  (d ^ (f & (h ^ d))) +
                  o[c] +
                  t[c]),
                ($ = d),
                (d = h),
                (h = f),
                (f = (p + n) >>> 0),
                (p = _),
                (_ = l),
                (l = u),
                (u = (n + (i = a + s)) >>> 0);
            (e.h0 = (e.h0 + u) | 0),
              (e.h1 = (e.h1 + l) | 0),
              (e.h2 = (e.h2 + _) | 0),
              (e.h3 = (e.h3 + p) | 0),
              (e.h4 = (e.h4 + f) | 0),
              (e.h5 = (e.h5 + h) | 0),
              (e.h6 = (e.h6 + d) | 0),
              (e.h7 = (e.h7 + $) | 0),
              (g -= 64);
          }
        }
      },
      { "./forge": 16, "./md": 23, "./util": 48 },
    ],
    44: [
      function (e, t, r) {
        var n = e("./forge");
        e("./md"), e("./util");
        var i = (t.exports = n.sha512 = n.sha512 || {});
        n.md.sha512 = n.md.algorithms.sha512 = i;
        var a = (n.sha384 = n.sha512.sha384 = n.sha512.sha384 || {});
        (a.create = function () {
          return i.create("SHA-384");
        }),
          (n.md.sha384 = n.md.algorithms.sha384 = a),
          (n.sha512.sha256 = n.sha512.sha256 || {
            create: function () {
              return i.create("SHA-512/256");
            },
          }),
          (n.md["sha512/256"] = n.md.algorithms["sha512/256"] =
            n.sha512.sha256),
          (n.sha512.sha224 = n.sha512.sha224 || {
            create: function () {
              return i.create("SHA-512/224");
            },
          }),
          (n.md["sha512/224"] = n.md.algorithms["sha512/224"] =
            n.sha512.sha224),
          (i.create = function (e) {
            if (
              (o ||
                ((s = "\x80"),
                (s += n.util.fillString("\0", 128)),
                (c = [
                  [1116352408, 3609767458],
                  [1899447441, 602891725],
                  [3049323471, 3964484399],
                  [3921009573, 2173295548],
                  [961987163, 4081628472],
                  [1508970993, 3053834265],
                  [2453635748, 2937671579],
                  [2870763221, 3664609560],
                  [3624381080, 2734883394],
                  [310598401, 1164996542],
                  [607225278, 1323610764],
                  [1426881987, 3590304994],
                  [1925078388, 4068182383],
                  [2162078206, 991336113],
                  [2614888103, 633803317],
                  [3248222580, 3479774868],
                  [3835390401, 2666613458],
                  [4022224774, 944711139],
                  [264347078, 2341262773],
                  [604807628, 2007800933],
                  [770255983, 1495990901],
                  [1249150122, 1856431235],
                  [1555081692, 3175218132],
                  [1996064986, 2198950837],
                  [2554220882, 3999719339],
                  [2821834349, 766784016],
                  [2952996808, 2566594879],
                  [3210313671, 3203337956],
                  [3336571891, 1034457026],
                  [3584528711, 2466948901],
                  [113926993, 3758326383],
                  [338241895, 168717936],
                  [666307205, 1188179964],
                  [773529912, 1546045734],
                  [1294757372, 1522805485],
                  [1396182291, 2643833823],
                  [1695183700, 2343527390],
                  [1986661051, 1014477480],
                  [2177026350, 1206759142],
                  [2456956037, 344077627],
                  [2730485921, 1290863460],
                  [2820302411, 3158454273],
                  [3259730800, 3505952657],
                  [3345764771, 106217008],
                  [3516065817, 3606008344],
                  [3600352804, 1432725776],
                  [4094571909, 1467031594],
                  [275423344, 851169720],
                  [430227734, 3100823752],
                  [506948616, 1363258195],
                  [659060556, 3750685593],
                  [883997877, 3785050280],
                  [958139571, 3318307427],
                  [1322822218, 3812723403],
                  [1537002063, 2003034995],
                  [1747873779, 3602036899],
                  [1955562222, 1575990012],
                  [2024104815, 1125592928],
                  [2227730452, 2716904306],
                  [2361852424, 442776044],
                  [2428436474, 593698344],
                  [2756734187, 3733110249],
                  [3204031479, 2999351573],
                  [3329325298, 3815920427],
                  [3391569614, 3928383900],
                  [3515267271, 566280711],
                  [3940187606, 3454069534],
                  [4118630271, 4000239992],
                  [116418474, 1914138554],
                  [174292421, 2731055270],
                  [289380356, 3203993006],
                  [460393269, 320620315],
                  [685471733, 587496836],
                  [852142971, 1086792851],
                  [1017036298, 365543100],
                  [1126000580, 2618297676],
                  [1288033470, 3409855158],
                  [1501505948, 4234509866],
                  [1607167915, 987167468],
                  [1816402316, 1246189591],
                ]),
                ((u = {})["SHA-512"] = [
                  [1779033703, 4089235720],
                  [3144134277, 2227873595],
                  [1013904242, 4271175723],
                  [2773480762, 1595750129],
                  [1359893119, 2917565137],
                  [2600822924, 725511199],
                  [528734635, 4215389547],
                  [1541459225, 327033209],
                ]),
                (u["SHA-384"] = [
                  [3418070365, 3238371032],
                  [1654270250, 914150663],
                  [2438529370, 812702999],
                  [355462360, 4144912697],
                  [1731405415, 4290775857],
                  [2394180231, 1750603025],
                  [3675008525, 1694076839],
                  [1203062813, 3204075428],
                ]),
                (u["SHA-512/256"] = [
                  [573645204, 4230739756],
                  [2673172387, 3360449730],
                  [596883563, 1867755857],
                  [2520282905, 1497426621],
                  [2519219938, 2827943907],
                  [3193839141, 1401305490],
                  [721525244, 746961066],
                  [246885852, 2177182882],
                ]),
                (u["SHA-512/224"] = [
                  [2352822216, 424955298],
                  [1944164710, 2312950998],
                  [502970286, 855612546],
                  [1738396948, 1479516111],
                  [258812777, 2077511080],
                  [2011393907, 79989058],
                  [1067287976, 1780299464],
                  [286451373, 2446758561],
                ]),
                (o = !0)),
              void 0 === e && (e = "SHA-512"),
              !(e in u))
            )
              throw Error("Invalid SHA-512 algorithm: " + e);
            for (
              var t = u[e],
                r = null,
                i = n.util.createBuffer(),
                a = Array(80),
                _ = 0;
              _ < 80;
              ++_
            )
              a[_] = [, ,];
            var p = 64;
            switch (e) {
              case "SHA-384":
                p = 48;
                break;
              case "SHA-512/256":
                p = 32;
                break;
              case "SHA-512/224":
                p = 28;
            }
            var f = {
              algorithm: e.replace("-", "").toLowerCase(),
              blockLength: 128,
              digestLength: p,
              messageLength: 0,
              fullMessageLength: null,
              messageLengthSize: 16,
              start: function () {
                (f.messageLength = 0),
                  (f.fullMessageLength = f.messageLength128 = []);
                for (var e = f.messageLengthSize / 4, a = 0; a < e; ++a)
                  f.fullMessageLength.push(0);
                for (
                  i = n.util.createBuffer(), r = Array(t.length), a = 0;
                  a < t.length;
                  ++a
                )
                  r[a] = t[a].slice(0);
                return f;
              },
            };
            return (
              f.start(),
              (f.update = function (e, t) {
                "utf8" === t && (e = n.util.encodeUtf8(e));
                var s = e.length;
                (f.messageLength += s), (s = [(s / 4294967296) >>> 0, s >>> 0]);
                for (var o = f.fullMessageLength.length - 1; o >= 0; --o)
                  (f.fullMessageLength[o] += s[1]),
                    (s[1] =
                      s[0] + ((f.fullMessageLength[o] / 4294967296) >>> 0)),
                    (f.fullMessageLength[o] = f.fullMessageLength[o] >>> 0),
                    (s[0] = (s[1] / 4294967296) >>> 0);
                return (
                  i.putBytes(e),
                  l(r, a, i),
                  (i.read > 2048 || 0 === i.length()) && i.compact(),
                  f
                );
              }),
              (f.digest = function () {
                var t = n.util.createBuffer();
                t.putBytes(i.bytes());
                var o,
                  c =
                    (f.fullMessageLength[f.fullMessageLength.length - 1] +
                      f.messageLengthSize) &
                    (f.blockLength - 1);
                t.putBytes(s.substr(0, f.blockLength - c));
                for (
                  var u = 8 * f.fullMessageLength[0], _ = 0;
                  _ < f.fullMessageLength.length - 1;
                  ++_
                )
                  (u +=
                    ((o = 8 * f.fullMessageLength[_ + 1]) / 4294967296) >>> 0),
                    t.putInt32(u >>> 0),
                    (u = o >>> 0);
                t.putInt32(u);
                var p = Array(r.length);
                for (_ = 0; _ < r.length; ++_) p[_] = r[_].slice(0);
                l(p, a, t);
                var h,
                  d = n.util.createBuffer();
                for (
                  _ = 0,
                    h =
                      "SHA-512" === e
                        ? p.length
                        : "SHA-384" === e
                        ? p.length - 2
                        : p.length - 4;
                  _ < h;
                  ++_
                )
                  d.putInt32(p[_][0]),
                    (_ === h - 1 && "SHA-512/224" === e) || d.putInt32(p[_][1]);
                return d;
              }),
              f
            );
          });
        var s = null,
          o = !1,
          c = null,
          u = null;
        function l(e, t, r) {
          for (
            var n,
              i,
              a,
              s,
              o,
              u,
              l,
              _,
              p,
              f,
              h,
              d,
              $,
              g,
              y,
              m,
              v,
              C,
              E,
              S,
              b,
              T,
              I,
              A,
              B,
              k,
              N,
              R,
              L,
              w,
              U,
              D,
              P,
              V = r.length();
            V >= 128;

          ) {
            for (N = 0; N < 16; ++N)
              (t[N][0] = r.getInt32() >>> 0), (t[N][1] = r.getInt32() >>> 0);
            for (; N < 80; ++N)
              (n =
                ((((R = (w = t[N - 2])[0]) >>> 19) | ((L = w[1]) << 13)) ^
                  ((L >>> 29) | (R << 3)) ^
                  (R >>> 6)) >>>
                0),
                (i =
                  (((R << 13) | (L >>> 19)) ^
                    ((L << 3) | (R >>> 29)) ^
                    ((R << 26) | (L >>> 6))) >>>
                  0),
                (a =
                  ((((R = (D = t[N - 15])[0]) >>> 1) | ((L = D[1]) << 31)) ^
                    ((R >>> 8) | (L << 24)) ^
                    (R >>> 7)) >>>
                  0),
                (s =
                  (((R << 31) | (L >>> 1)) ^
                    ((R << 24) | (L >>> 8)) ^
                    ((R << 25) | (L >>> 7))) >>>
                  0),
                (U = t[N - 7]),
                (P = t[N - 16]),
                (L = i + U[1] + s + P[1]),
                (t[N][0] =
                  (n + U[0] + a + P[0] + ((L / 4294967296) >>> 0)) >>> 0),
                (t[N][1] = L >>> 0);
            for (
              h = e[0][0],
                d = e[0][1],
                $ = e[1][0],
                g = e[1][1],
                y = e[2][0],
                m = e[2][1],
                v = e[3][0],
                C = e[3][1],
                E = e[4][0],
                S = e[4][1],
                b = e[5][0],
                T = e[5][1],
                I = e[6][0],
                A = e[6][1],
                B = e[7][0],
                k = e[7][1],
                N = 0;
              N < 80;
              ++N
            )
              (l =
                (((E >>> 14) | (S << 18)) ^
                  ((E >>> 18) | (S << 14)) ^
                  ((S >>> 9) | (E << 23))) >>>
                0),
                (_ = (I ^ (E & (b ^ I))) >>> 0),
                (o =
                  (((h >>> 28) | (d << 4)) ^
                    ((d >>> 2) | (h << 30)) ^
                    ((d >>> 7) | (h << 25))) >>>
                  0),
                (u =
                  (((h << 4) | (d >>> 28)) ^
                    ((d << 30) | (h >>> 2)) ^
                    ((d << 25) | (h >>> 7))) >>>
                  0),
                (p = ((h & $) | (y & (h ^ $))) >>> 0),
                (f = ((d & g) | (m & (d ^ g))) >>> 0),
                (L =
                  k +
                  ((((E << 18) | (S >>> 14)) ^
                    ((E << 14) | (S >>> 18)) ^
                    ((S << 23) | (E >>> 9))) >>>
                    0) +
                  ((A ^ (S & (T ^ A))) >>> 0) +
                  c[N][1] +
                  t[N][1]),
                (n =
                  (B + l + _ + c[N][0] + t[N][0] + ((L / 4294967296) >>> 0)) >>>
                  0),
                (i = L >>> 0),
                (a = (o + p + (((L = u + f) / 4294967296) >>> 0)) >>> 0),
                (s = L >>> 0),
                (B = I),
                (k = A),
                (I = b),
                (A = T),
                (b = E),
                (T = S),
                (E = (v + n + (((L = C + i) / 4294967296) >>> 0)) >>> 0),
                (S = L >>> 0),
                (v = y),
                (C = m),
                (y = $),
                (m = g),
                ($ = h),
                (g = d),
                (h = (n + a + (((L = i + s) / 4294967296) >>> 0)) >>> 0),
                (d = L >>> 0);
            (L = e[0][1] + d),
              (e[0][0] = (e[0][0] + h + ((L / 4294967296) >>> 0)) >>> 0),
              (e[0][1] = L >>> 0),
              (L = e[1][1] + g),
              (e[1][0] = (e[1][0] + $ + ((L / 4294967296) >>> 0)) >>> 0),
              (e[1][1] = L >>> 0),
              (L = e[2][1] + m),
              (e[2][0] = (e[2][0] + y + ((L / 4294967296) >>> 0)) >>> 0),
              (e[2][1] = L >>> 0),
              (L = e[3][1] + C),
              (e[3][0] = (e[3][0] + v + ((L / 4294967296) >>> 0)) >>> 0),
              (e[3][1] = L >>> 0),
              (L = e[4][1] + S),
              (e[4][0] = (e[4][0] + E + ((L / 4294967296) >>> 0)) >>> 0),
              (e[4][1] = L >>> 0),
              (L = e[5][1] + T),
              (e[5][0] = (e[5][0] + b + ((L / 4294967296) >>> 0)) >>> 0),
              (e[5][1] = L >>> 0),
              (L = e[6][1] + A),
              (e[6][0] = (e[6][0] + I + ((L / 4294967296) >>> 0)) >>> 0),
              (e[6][1] = L >>> 0),
              (L = e[7][1] + k),
              (e[7][0] = (e[7][0] + B + ((L / 4294967296) >>> 0)) >>> 0),
              (e[7][1] = L >>> 0),
              (V -= 128);
          }
        }
      },
      { "./forge": 16, "./md": 23, "./util": 48 },
    ],
    45: [
      function (e, t, r) {
        var n = e("./forge");
        e("./aes"), e("./hmac"), e("./md5"), e("./sha1"), e("./util");
        var i = (t.exports = n.ssh = n.ssh || {});
        function a(e, t) {
          var r = t.toString(16);
          r[0] >= "8" && (r = "00" + r);
          var i = n.util.hexToBytes(r);
          e.putInt32(i.length), e.putBytes(i);
        }
        function s(e, t) {
          e.putInt32(t.length), e.putString(t);
        }
        function o() {
          for (
            var e = n.md.sha1.create(), t = arguments.length, r = 0;
            r < t;
            ++r
          )
            e.update(arguments[r]);
          return e.digest();
        }
        (i.privateKeyToPutty = function (e, t, r) {
          var i = "" === (t = t || "") ? "none" : "aes256-cbc",
            c = "PuTTY-User-Key-File-2: ssh-rsa\r\n";
          (c += "Encryption: " + i + "\r\n"),
            (c += "Comment: " + (r = r || "") + "\r\n");
          var u = n.util.createBuffer();
          s(u, "ssh-rsa"), a(u, e.e), a(u, e.n);
          var l = n.util.encode64(u.bytes(), 64),
            _ = Math.floor(l.length / 66) + 1;
          (c += "Public-Lines: " + _ + "\r\n"), (c += l);
          var p,
            f = n.util.createBuffer();
          if ((a(f, e.d), a(f, e.p), a(f, e.q), a(f, e.qInv), t)) {
            var h = f.length() + 16 - 1;
            h -= h % 16;
            var d = o(f.bytes());
            d.truncate(d.length() - h + f.length()), f.putBuffer(d);
            var $ = n.util.createBuffer();
            $.putBuffer(o("\0\0\0\0", t)), $.putBuffer(o("\0\0\0\x01", t));
            var g = n.aes.createEncryptionCipher($.truncate(8), "CBC");
            g.start(n.util.createBuffer().fillWithByte(0, 16)),
              g.update(f.copy()),
              g.finish();
            var y = g.output;
            y.truncate(16), (p = n.util.encode64(y.bytes(), 64));
          } else p = n.util.encode64(f.bytes(), 64);
          (c +=
            "\r\nPrivate-Lines: " +
            (_ = Math.floor(p.length / 66) + 1) +
            "\r\n"),
            (c += p);
          var m = o("putty-private-key-file-mac-key", t),
            v = n.util.createBuffer();
          s(v, "ssh-rsa"),
            s(v, i),
            s(v, r),
            v.putInt32(u.length()),
            v.putBuffer(u),
            v.putInt32(f.length()),
            v.putBuffer(f);
          var C = n.hmac.create();
          return (
            C.start("sha1", m),
            C.update(v.bytes()),
            (c += "\r\nPrivate-MAC: " + C.digest().toHex() + "\r\n")
          );
        }),
          (i.publicKeyToOpenSSH = function (e, t) {
            t = t || "";
            var r = n.util.createBuffer();
            return (
              s(r, "ssh-rsa"),
              a(r, e.e),
              a(r, e.n),
              "ssh-rsa " + n.util.encode64(r.bytes()) + " " + t
            );
          }),
          (i.privateKeyToOpenSSH = function (e, t) {
            return t
              ? n.pki.encryptRsaPrivateKey(e, t, {
                  legacy: !0,
                  algorithm: "aes128",
                })
              : n.pki.privateKeyToPem(e);
          }),
          (i.getPublicKeyFingerprint = function (e, t) {
            var r = (t = t || {}).md || n.md.md5.create(),
              i = n.util.createBuffer();
            s(i, "ssh-rsa"),
              a(i, e.e),
              a(i, e.n),
              r.start(),
              r.update(i.getBytes());
            var o = r.digest();
            if ("hex" === t.encoding) {
              var c = o.toHex();
              return t.delimiter ? c.match(/.{2}/g).join(t.delimiter) : c;
            }
            if ("binary" === t.encoding) return o.getBytes();
            if (t.encoding)
              throw Error('Unknown encoding "' + t.encoding + '".');
            return o;
          });
      },
      {
        "./aes": 7,
        "./forge": 16,
        "./hmac": 17,
        "./md5": 24,
        "./sha1": 42,
        "./util": 48,
      },
    ],
    46: [
      function (e, t, r) {
        var n = e("./forge");
        e("./debug"), e("./log"), e("./util");
        var i = "forge.task",
          a = {},
          s = 0;
        n.debug.set(i, "tasks", a);
        var o = {};
        n.debug.set(i, "queues", o);
        var c = "ready",
          u = "running",
          l = "blocked",
          _ = "sleeping",
          p = "done",
          f = "error",
          h = { ready: {} };
        (h.ready.stop = c),
          (h.ready.start = u),
          (h.ready.cancel = p),
          (h.ready.fail = f),
          (h.running = {}),
          (h.running.stop = c),
          (h.running.start = u),
          (h.running.block = l),
          (h.running.unblock = u),
          (h.running.sleep = _),
          (h.running.wakeup = u),
          (h.running.cancel = p),
          (h.running.fail = f),
          (h.blocked = {}),
          (h.blocked.stop = l),
          (h.blocked.start = l),
          (h.blocked.block = l),
          (h.blocked.unblock = l),
          (h.blocked.sleep = l),
          (h.blocked.wakeup = l),
          (h.blocked.cancel = p),
          (h.blocked.fail = f),
          (h.sleeping = {}),
          (h.sleeping.stop = _),
          (h.sleeping.start = _),
          (h.sleeping.block = _),
          (h.sleeping.unblock = _),
          (h.sleeping.sleep = _),
          (h.sleeping.wakeup = _),
          (h.sleeping.cancel = p),
          (h.sleeping.fail = f),
          (h.done = {}),
          (h.done.stop = p),
          (h.done.start = p),
          (h.done.block = p),
          (h.done.unblock = p),
          (h.done.sleep = p),
          (h.done.wakeup = p),
          (h.done.cancel = p),
          (h.done.fail = f),
          (h.error = {}),
          (h.error.stop = f),
          (h.error.start = f),
          (h.error.block = f),
          (h.error.unblock = f),
          (h.error.sleep = f),
          (h.error.wakeup = f),
          (h.error.cancel = f),
          (h.error.fail = f);
        var d = function (e) {
          (this.id = -1),
            (this.name = e.name || "?"),
            (this.parent = e.parent || null),
            (this.run = e.run),
            (this.subtasks = []),
            (this.error = !1),
            (this.state = c),
            (this.blocks = 0),
            (this.timeoutId = null),
            (this.swapTime = null),
            (this.userData = null),
            (this.id = s++),
            (a[this.id] = this);
        };
        (d.prototype.debug = function (e) {
          (e = e || ""),
            n.log.debug(
              i,
              e,
              "[%s][%s] task:",
              this.id,
              this.name,
              this,
              "subtasks:",
              this.subtasks.length,
              "queue:",
              o
            );
        }),
          (d.prototype.next = function (e, t) {
            "function" == typeof e && ((t = e), (e = this.name));
            var r = new d({ run: t, name: e, parent: this });
            return (
              (r.state = u),
              (r.type = this.type),
              (r.successCallback = this.successCallback || null),
              (r.failureCallback = this.failureCallback || null),
              this.subtasks.push(r),
              this
            );
          }),
          (d.prototype.parallel = function (e, t) {
            return (
              n.util.isArray(e) && ((t = e), (e = this.name)),
              this.next(e, function (r) {
                var i = r;
                i.block(t.length);
                for (
                  var a = function (e, r) {
                      n.task.start({
                        type: e,
                        run: function (e) {
                          t[r](e);
                        },
                        success: function (e) {
                          i.unblock();
                        },
                        failure: function (e) {
                          i.unblock();
                        },
                      });
                    },
                    s = 0;
                  s < t.length;
                  s++
                )
                  a(e + "__parallel-" + r.id + "-" + s, s);
              })
            );
          }),
          (d.prototype.stop = function () {
            this.state = h[this.state].stop;
          }),
          (d.prototype.start = function () {
            (this.error = !1),
              (this.state = h[this.state].start),
              this.state === u &&
                ((this.start = new Date()), this.run(this), $(this, 0));
          }),
          (d.prototype.block = function (e) {
            (e = void 0 === e ? 1 : e),
              (this.blocks += e),
              this.blocks > 0 && (this.state = h[this.state].block);
          }),
          (d.prototype.unblock = function (e) {
            return (
              (e = void 0 === e ? 1 : e),
              (this.blocks -= e),
              0 === this.blocks &&
                this.state !== p &&
                ((this.state = u), $(this, 0)),
              this.blocks
            );
          }),
          (d.prototype.sleep = function (e) {
            (e = void 0 === e ? 0 : e), (this.state = h[this.state].sleep);
            var t = this;
            this.timeoutId = setTimeout(function () {
              (t.timeoutId = null), (t.state = u), $(t, 0);
            }, e);
          }),
          (d.prototype.wait = function (e) {
            e.wait(this);
          }),
          (d.prototype.wakeup = function () {
            this.state === _ &&
              (cancelTimeout(this.timeoutId),
              (this.timeoutId = null),
              (this.state = u),
              $(this, 0));
          }),
          (d.prototype.cancel = function () {
            (this.state = h[this.state].cancel),
              (this.permitsNeeded = 0),
              null !== this.timeoutId &&
                (cancelTimeout(this.timeoutId), (this.timeoutId = null)),
              (this.subtasks = []);
          }),
          (d.prototype.fail = function (e) {
            if (((this.error = !0), g(this, !0), e))
              (e.error = this.error),
                (e.swapTime = this.swapTime),
                (e.userData = this.userData),
                $(e, 0);
            else {
              if (null !== this.parent) {
                for (var t = this.parent; null !== t.parent; )
                  (t.error = this.error),
                    (t.swapTime = this.swapTime),
                    (t.userData = this.userData),
                    (t = t.parent);
                g(t, !0);
              }
              this.failureCallback && this.failureCallback(this);
            }
          });
        var $ = function (e, t) {
            var r = t > 30 || +new Date() - e.swapTime > 20,
              n = function (t) {
                if ((t++, e.state === u)) {
                  if (
                    (r && (e.swapTime = +new Date()), e.subtasks.length > 0)
                  ) {
                    var n = e.subtasks.shift();
                    (n.error = e.error),
                      (n.swapTime = e.swapTime),
                      (n.userData = e.userData),
                      n.run(n),
                      n.error || $(n, t);
                  } else
                    g(e),
                      e.error ||
                        (null !== e.parent &&
                          ((e.parent.error = e.error),
                          (e.parent.swapTime = e.swapTime),
                          (e.parent.userData = e.userData),
                          $(e.parent, t)));
                }
              };
            r ? setTimeout(n, 0) : n(t);
          },
          g = function (e, t) {
            (e.state = p),
              delete a[e.id],
              null === e.parent &&
                (e.type in o
                  ? 0 === o[e.type].length
                    ? n.log.error(
                        i,
                        "[%s][%s] task queue empty [%s]",
                        e.id,
                        e.name,
                        e.type
                      )
                    : o[e.type][0] !== e
                    ? n.log.error(
                        i,
                        "[%s][%s] task not first in queue [%s]",
                        e.id,
                        e.name,
                        e.type
                      )
                    : (o[e.type].shift(),
                      0 === o[e.type].length
                        ? delete o[e.type]
                        : o[e.type][0].start())
                  : n.log.error(
                      i,
                      "[%s][%s] task queue missing [%s]",
                      e.id,
                      e.name,
                      e.type
                    ),
                t ||
                  (e.error && e.failureCallback
                    ? e.failureCallback(e)
                    : !e.error && e.successCallback && e.successCallback(e)));
          };
        (t.exports = n.task = n.task || {}),
          (n.task.start = function (e) {
            var t,
              r = new d({ run: e.run, name: e.name || "?" });
            (r.type = e.type),
              (r.successCallback = e.success || null),
              (r.failureCallback = e.failure || null),
              r.type in o
                ? o[e.type].push(r)
                : ((o[r.type] = [r]),
                  ((t = r).error = !1),
                  (t.state = h[t.state].start),
                  setTimeout(function () {
                    t.state === u &&
                      ((t.swapTime = +new Date()), t.run(t), $(t, 0));
                  }, 0));
          }),
          (n.task.cancel = function (e) {
            e in o && (o[e] = [o[e][0]]);
          }),
          (n.task.createCondition = function () {
            var e = {
              tasks: {},
              wait: function (t) {
                t.id in e.tasks || (t.block(), (e.tasks[t.id] = t));
              },
              notify: function () {
                var t = e.tasks;
                for (var r in ((e.tasks = {}), t)) t[r].unblock();
              },
            };
            return e;
          });
      },
      { "./debug": 13, "./forge": 16, "./log": 21, "./util": 48 },
    ],
    47: [
      function (e, t, r) {
        var n = e("./forge");
        e("./asn1"),
          e("./hmac"),
          e("./md5"),
          e("./pem"),
          e("./pki"),
          e("./random"),
          e("./sha1"),
          e("./util");
        var i = function (e, t, r, i) {
            var a = n.util.createBuffer(),
              s = e.length >> 1,
              o = s + (1 & e.length),
              c = e.substr(0, o),
              u = e.substr(s, o),
              l = n.util.createBuffer(),
              _ = n.hmac.create();
            r = t + r;
            var p = Math.ceil(i / 16),
              f = Math.ceil(i / 20);
            _.start("MD5", c);
            var h = n.util.createBuffer();
            l.putBytes(r);
            for (var d = 0; d < p; ++d)
              _.start(null, null),
                _.update(l.getBytes()),
                l.putBuffer(_.digest()),
                _.start(null, null),
                _.update(l.bytes() + r),
                h.putBuffer(_.digest());
            _.start("SHA1", u);
            var $ = n.util.createBuffer();
            for (l.clear(), l.putBytes(r), d = 0; d < f; ++d)
              _.start(null, null),
                _.update(l.getBytes()),
                l.putBuffer(_.digest()),
                _.start(null, null),
                _.update(l.bytes() + r),
                $.putBuffer(_.digest());
            return (
              a.putBytes(n.util.xorBytes(h.getBytes(), $.getBytes(), i)), a
            );
          },
          a = function (e, t, r) {
            var i = !1;
            try {
              var a = e.deflate(t.fragment.getBytes());
              (t.fragment = n.util.createBuffer(a)),
                (t.length = a.length),
                (i = !0);
            } catch (s) {}
            return i;
          },
          s = function (e, t, r) {
            var i = !1;
            try {
              var a = e.inflate(t.fragment.getBytes());
              (t.fragment = n.util.createBuffer(a)),
                (t.length = a.length),
                (i = !0);
            } catch (s) {}
            return i;
          },
          o = function (e, t) {
            var r = 0;
            switch (t) {
              case 1:
                r = e.getByte();
                break;
              case 2:
                r = e.getInt16();
                break;
              case 3:
                r = e.getInt24();
                break;
              case 4:
                r = e.getInt32();
            }
            return n.util.createBuffer(e.getBytes(r));
          },
          c = function (e, t, r) {
            e.putInt(r.length(), t << 3), e.putBuffer(r);
          },
          u = {
            Versions: {
              TLS_1_0: { major: 3, minor: 1 },
              TLS_1_1: { major: 3, minor: 2 },
              TLS_1_2: { major: 3, minor: 3 },
            },
          };
        (u.SupportedVersions = [u.Versions.TLS_1_1, u.Versions.TLS_1_0]),
          (u.Version = u.SupportedVersions[0]),
          (u.MaxFragment = 15360),
          (u.ConnectionEnd = { server: 0, client: 1 }),
          (u.PRFAlgorithm = { tls_prf_sha256: 0 }),
          (u.BulkCipherAlgorithm = { none: null, rc4: 0, des3: 1, aes: 2 }),
          (u.CipherType = { stream: 0, block: 1, aead: 2 }),
          (u.MACAlgorithm = {
            none: null,
            hmac_md5: 0,
            hmac_sha1: 1,
            hmac_sha256: 2,
            hmac_sha384: 3,
            hmac_sha512: 4,
          }),
          (u.CompressionMethod = { none: 0, deflate: 1 }),
          (u.ContentType = {
            change_cipher_spec: 20,
            alert: 21,
            handshake: 22,
            application_data: 23,
            heartbeat: 24,
          }),
          (u.HandshakeType = {
            hello_request: 0,
            client_hello: 1,
            server_hello: 2,
            certificate: 11,
            server_key_exchange: 12,
            certificate_request: 13,
            server_hello_done: 14,
            certificate_verify: 15,
            client_key_exchange: 16,
            finished: 20,
          }),
          (u.Alert = {}),
          (u.Alert.Level = { warning: 1, fatal: 2 }),
          (u.Alert.Description = {
            close_notify: 0,
            unexpected_message: 10,
            bad_record_mac: 20,
            decryption_failed: 21,
            record_overflow: 22,
            decompression_failure: 30,
            handshake_failure: 40,
            bad_certificate: 42,
            unsupported_certificate: 43,
            certificate_revoked: 44,
            certificate_expired: 45,
            certificate_unknown: 46,
            illegal_parameter: 47,
            unknown_ca: 48,
            access_denied: 49,
            decode_error: 50,
            decrypt_error: 51,
            export_restriction: 60,
            protocol_version: 70,
            insufficient_security: 71,
            internal_error: 80,
            user_canceled: 90,
            no_renegotiation: 100,
          }),
          (u.HeartbeatMessageType = {
            heartbeat_request: 1,
            heartbeat_response: 2,
          }),
          (u.CipherSuites = {}),
          (u.getCipherSuite = function (e) {
            var t = null;
            for (var r in u.CipherSuites) {
              var n = u.CipherSuites[r];
              if (n.id[0] === e.charCodeAt(0) && n.id[1] === e.charCodeAt(1)) {
                t = n;
                break;
              }
            }
            return t;
          }),
          (u.handleUnexpected = function (e, t) {
            (e.open || e.entity !== u.ConnectionEnd.client) &&
              e.error(e, {
                message:
                  "Unexpected message. Received TLS record out of order.",
                send: !0,
                alert: {
                  level: u.Alert.Level.fatal,
                  description: u.Alert.Description.unexpected_message,
                },
              });
          }),
          (u.handleHelloRequest = function (e, t, r) {
            !e.handshaking &&
              e.handshakes > 0 &&
              (u.queue(
                e,
                u.createAlert(e, {
                  level: u.Alert.Level.warning,
                  description: u.Alert.Description.no_renegotiation,
                })
              ),
              u.flush(e)),
              e.process();
          }),
          (u.parseHelloMessage = function (e, t, r) {
            var i = null,
              a = e.entity === u.ConnectionEnd.client;
            if (r < 38)
              e.error(e, {
                message: a
                  ? "Invalid ServerHello message. Message too short."
                  : "Invalid ClientHello message. Message too short.",
                send: !0,
                alert: {
                  level: u.Alert.Level.fatal,
                  description: u.Alert.Description.illegal_parameter,
                },
              });
            else {
              var s = t.fragment,
                c = s.length();
              if (
                ((i = {
                  version: { major: s.getByte(), minor: s.getByte() },
                  random: n.util.createBuffer(s.getBytes(32)),
                  session_id: o(s, 1),
                  extensions: [],
                }),
                a
                  ? ((i.cipher_suite = s.getBytes(2)),
                    (i.compression_method = s.getByte()))
                  : ((i.cipher_suites = o(s, 2)),
                    (i.compression_methods = o(s, 1))),
                (c = r - (c - s.length())) > 0)
              ) {
                for (var l = o(s, 2); l.length() > 0; )
                  i.extensions.push({
                    type: [l.getByte(), l.getByte()],
                    data: o(l, 2),
                  });
                if (!a)
                  for (var _ = 0; _ < i.extensions.length; ++_) {
                    var p = i.extensions[_];
                    if (0 === p.type[0] && 0 === p.type[1])
                      for (
                        var f = o(p.data, 2);
                        f.length() > 0 && 0 === f.getByte();

                      )
                        e.session.extensions.server_name.serverNameList.push(
                          o(f, 2).getBytes()
                        );
                  }
              }
              if (
                e.session.version &&
                (i.version.major !== e.session.version.major ||
                  i.version.minor !== e.session.version.minor)
              )
                return e.error(e, {
                  message:
                    "TLS version change is disallowed during renegotiation.",
                  send: !0,
                  alert: {
                    level: u.Alert.Level.fatal,
                    description: u.Alert.Description.protocol_version,
                  },
                });
              if (a) e.session.cipherSuite = u.getCipherSuite(i.cipher_suite);
              else
                for (
                  var h = n.util.createBuffer(i.cipher_suites.bytes());
                  h.length() > 0 &&
                  ((e.session.cipherSuite = u.getCipherSuite(h.getBytes(2))),
                  null === e.session.cipherSuite);

                );
              if (null === e.session.cipherSuite)
                return e.error(e, {
                  message: "No cipher suites in common.",
                  send: !0,
                  alert: {
                    level: u.Alert.Level.fatal,
                    description: u.Alert.Description.handshake_failure,
                  },
                  cipherSuite: n.util.bytesToHex(i.cipher_suite),
                });
              e.session.compressionMethod = a
                ? i.compression_method
                : u.CompressionMethod.none;
            }
            return i;
          }),
          (u.createSecurityParameters = function (e, t) {
            var r = e.entity === u.ConnectionEnd.client,
              n = t.random.bytes(),
              i = r ? e.session.sp.client_random : n,
              a = r ? n : u.createRandom().getBytes();
            e.session.sp = {
              entity: e.entity,
              prf_algorithm: u.PRFAlgorithm.tls_prf_sha256,
              bulk_cipher_algorithm: null,
              cipher_type: null,
              enc_key_length: null,
              block_length: null,
              fixed_iv_length: null,
              record_iv_length: null,
              mac_algorithm: null,
              mac_length: null,
              mac_key_length: null,
              compression_algorithm: e.session.compressionMethod,
              pre_master_secret: null,
              master_secret: null,
              client_random: i,
              server_random: a,
            };
          }),
          (u.handleServerHello = function (e, t, r) {
            var n = u.parseHelloMessage(e, t, r);
            if (!e.fail) {
              if (!(n.version.minor <= e.version.minor))
                return e.error(e, {
                  message: "Incompatible TLS version.",
                  send: !0,
                  alert: {
                    level: u.Alert.Level.fatal,
                    description: u.Alert.Description.protocol_version,
                  },
                });
              (e.version.minor = n.version.minor),
                (e.session.version = e.version);
              var i = n.session_id.bytes();
              i.length > 0 && i === e.session.id
                ? ((e.expect = h),
                  (e.session.resuming = !0),
                  (e.session.sp.server_random = n.random.bytes()))
                : ((e.expect = l),
                  (e.session.resuming = !1),
                  u.createSecurityParameters(e, n)),
                (e.session.id = i),
                e.process();
            }
          }),
          (u.handleClientHello = function (e, t, r) {
            var i = u.parseHelloMessage(e, t, r);
            if (!e.fail) {
              var a = i.session_id.bytes(),
                s = null;
              if (
                (e.sessionCache &&
                  (null === (s = e.sessionCache.getSession(a))
                    ? (a = "")
                    : (s.version.major !== i.version.major ||
                        s.version.minor > i.version.minor) &&
                      ((s = null), (a = ""))),
                0 === a.length && (a = n.random.getBytes(32)),
                (e.session.id = a),
                (e.session.clientHelloVersion = i.version),
                (e.session.sp = {}),
                s)
              )
                (e.version = e.session.version = s.version),
                  (e.session.sp = s.sp);
              else {
                for (
                  var o, c = 1;
                  c < u.SupportedVersions.length &&
                  !((o = u.SupportedVersions[c]).minor <= i.version.minor);
                  ++c
                );
                (e.version = { major: o.major, minor: o.minor }),
                  (e.session.version = e.version);
              }
              null !== s
                ? ((e.expect = C),
                  (e.session.resuming = !0),
                  (e.session.sp.client_random = i.random.bytes()))
                : ((e.expect = !1 !== e.verifyClient ? y : m),
                  (e.session.resuming = !1),
                  u.createSecurityParameters(e, i)),
                (e.open = !0),
                u.queue(
                  e,
                  u.createRecord(e, {
                    type: u.ContentType.handshake,
                    data: u.createServerHello(e),
                  })
                ),
                e.session.resuming
                  ? (u.queue(
                      e,
                      u.createRecord(e, {
                        type: u.ContentType.change_cipher_spec,
                        data: u.createChangeCipherSpec(),
                      })
                    ),
                    (e.state.pending = u.createConnectionState(e)),
                    (e.state.current.write = e.state.pending.write),
                    u.queue(
                      e,
                      u.createRecord(e, {
                        type: u.ContentType.handshake,
                        data: u.createFinished(e),
                      })
                    ))
                  : (u.queue(
                      e,
                      u.createRecord(e, {
                        type: u.ContentType.handshake,
                        data: u.createCertificate(e),
                      })
                    ),
                    e.fail ||
                      (u.queue(
                        e,
                        u.createRecord(e, {
                          type: u.ContentType.handshake,
                          data: u.createServerKeyExchange(e),
                        })
                      ),
                      !1 !== e.verifyClient &&
                        u.queue(
                          e,
                          u.createRecord(e, {
                            type: u.ContentType.handshake,
                            data: u.createCertificateRequest(e),
                          })
                        ),
                      u.queue(
                        e,
                        u.createRecord(e, {
                          type: u.ContentType.handshake,
                          data: u.createServerHelloDone(e),
                        })
                      ))),
                u.flush(e),
                e.process();
            }
          }),
          (u.handleCertificate = function (e, t, r) {
            if (r < 3)
              return e.error(e, {
                message: "Invalid Certificate message. Message too short.",
                send: !0,
                alert: {
                  level: u.Alert.Level.fatal,
                  description: u.Alert.Description.illegal_parameter,
                },
              });
            var i,
              a,
              s = { certificate_list: o(t.fragment, 3) },
              c = [];
            try {
              for (; s.certificate_list.length() > 0; )
                (i = o(s.certificate_list, 3)),
                  (a = n.asn1.fromDer(i)),
                  (i = n.pki.certificateFromAsn1(a, !0)),
                  c.push(i);
            } catch (l) {
              return e.error(e, {
                message: "Could not parse certificate list.",
                cause: l,
                send: !0,
                alert: {
                  level: u.Alert.Level.fatal,
                  description: u.Alert.Description.bad_certificate,
                },
              });
            }
            var p = e.entity === u.ConnectionEnd.client;
            (p || !0 === e.verifyClient) && 0 === c.length
              ? e.error(e, {
                  message: p
                    ? "No server certificate provided."
                    : "No client certificate provided.",
                  send: !0,
                  alert: {
                    level: u.Alert.Level.fatal,
                    description: u.Alert.Description.illegal_parameter,
                  },
                })
              : 0 === c.length
              ? (e.expect = p ? _ : m)
              : (p
                  ? (e.session.serverCertificate = c[0])
                  : (e.session.clientCertificate = c[0]),
                u.verifyCertificateChain(e, c) && (e.expect = p ? _ : m)),
              e.process();
          }),
          (u.handleServerKeyExchange = function (e, t, r) {
            if (r > 0)
              return e.error(e, {
                message: "Invalid key parameters. Only RSA is supported.",
                send: !0,
                alert: {
                  level: u.Alert.Level.fatal,
                  description: u.Alert.Description.unsupported_certificate,
                },
              });
            (e.expect = p), e.process();
          }),
          (u.handleClientKeyExchange = function (e, t, r) {
            if (r < 48)
              return e.error(e, {
                message: "Invalid key parameters. Only RSA is supported.",
                send: !0,
                alert: {
                  level: u.Alert.Level.fatal,
                  description: u.Alert.Description.unsupported_certificate,
                },
              });
            var i = { enc_pre_master_secret: o(t.fragment, 2).getBytes() },
              a = null;
            if (e.getPrivateKey)
              try {
                (a = e.getPrivateKey(e, e.session.serverCertificate)),
                  (a = n.pki.privateKeyFromPem(a));
              } catch (s) {
                e.error(e, {
                  message: "Could not get private key.",
                  cause: s,
                  send: !0,
                  alert: {
                    level: u.Alert.Level.fatal,
                    description: u.Alert.Description.internal_error,
                  },
                });
              }
            if (null === a)
              return e.error(e, {
                message: "No private key set.",
                send: !0,
                alert: {
                  level: u.Alert.Level.fatal,
                  description: u.Alert.Description.internal_error,
                },
              });
            try {
              var c = e.session.sp;
              c.pre_master_secret = a.decrypt(i.enc_pre_master_secret);
              var l = e.session.clientHelloVersion;
              if (
                l.major !== c.pre_master_secret.charCodeAt(0) ||
                l.minor !== c.pre_master_secret.charCodeAt(1)
              )
                throw Error("TLS version rollback attack detected.");
            } catch (_) {
              c.pre_master_secret = n.random.getBytes(48);
            }
            (e.expect = C),
              null !== e.session.clientCertificate && (e.expect = v),
              e.process();
          }),
          (u.handleCertificateRequest = function (e, t, r) {
            if (r < 3)
              return e.error(e, {
                message: "Invalid CertificateRequest. Message too short.",
                send: !0,
                alert: {
                  level: u.Alert.Level.fatal,
                  description: u.Alert.Description.illegal_parameter,
                },
              });
            var n = t.fragment,
              i = {
                certificate_types: o(n, 1),
                certificate_authorities: o(n, 2),
              };
            (e.session.certificateRequest = i), (e.expect = f), e.process();
          }),
          (u.handleCertificateVerify = function (e, t, r) {
            if (r < 2)
              return e.error(e, {
                message: "Invalid CertificateVerify. Message too short.",
                send: !0,
                alert: {
                  level: u.Alert.Level.fatal,
                  description: u.Alert.Description.illegal_parameter,
                },
              });
            var i = t.fragment;
            i.read -= 4;
            var a = i.bytes();
            i.read += 4;
            var s = { signature: o(i, 2).getBytes() },
              c = n.util.createBuffer();
            c.putBuffer(e.session.md5.digest()),
              c.putBuffer(e.session.sha1.digest()),
              (c = c.getBytes());
            try {
              if (
                !e.session.clientCertificate.publicKey.verify(
                  c,
                  s.signature,
                  "NONE"
                )
              )
                throw Error("CertificateVerify signature does not match.");
              e.session.md5.update(a), e.session.sha1.update(a);
            } catch (l) {
              return e.error(e, {
                message: "Bad signature in CertificateVerify.",
                send: !0,
                alert: {
                  level: u.Alert.Level.fatal,
                  description: u.Alert.Description.handshake_failure,
                },
              });
            }
            (e.expect = C), e.process();
          }),
          (u.handleServerHelloDone = function (e, t, r) {
            if (r > 0)
              return e.error(e, {
                message: "Invalid ServerHelloDone message. Invalid length.",
                send: !0,
                alert: {
                  level: u.Alert.Level.fatal,
                  description: u.Alert.Description.record_overflow,
                },
              });
            if (null === e.serverCertificate) {
              var i = {
                  message:
                    "No server certificate provided. Not enough security.",
                  send: !0,
                  alert: {
                    level: u.Alert.Level.fatal,
                    description: u.Alert.Description.insufficient_security,
                  },
                },
                a = e.verify(e, i.alert.description, 0, []);
              if (!0 !== a)
                return (
                  (a || 0 === a) &&
                    ("object" != typeof a || n.util.isArray(a)
                      ? "number" == typeof a && (i.alert.description = a)
                      : (a.message && (i.message = a.message),
                        a.alert && (i.alert.description = a.alert))),
                  e.error(e, i)
                );
            }
            null !== e.session.certificateRequest &&
              ((t = u.createRecord(e, {
                type: u.ContentType.handshake,
                data: u.createCertificate(e),
              })),
              u.queue(e, t)),
              (t = u.createRecord(e, {
                type: u.ContentType.handshake,
                data: u.createClientKeyExchange(e),
              })),
              u.queue(e, t),
              (e.expect = g);
            var s = function (e, t) {
              null !== e.session.certificateRequest &&
                null !== e.session.clientCertificate &&
                u.queue(
                  e,
                  u.createRecord(e, {
                    type: u.ContentType.handshake,
                    data: u.createCertificateVerify(e, t),
                  })
                ),
                u.queue(
                  e,
                  u.createRecord(e, {
                    type: u.ContentType.change_cipher_spec,
                    data: u.createChangeCipherSpec(),
                  })
                ),
                (e.state.pending = u.createConnectionState(e)),
                (e.state.current.write = e.state.pending.write),
                u.queue(
                  e,
                  u.createRecord(e, {
                    type: u.ContentType.handshake,
                    data: u.createFinished(e),
                  })
                ),
                (e.expect = h),
                u.flush(e),
                e.process();
            };
            if (
              null === e.session.certificateRequest ||
              null === e.session.clientCertificate
            )
              return s(e, null);
            u.getClientSignature(e, s);
          }),
          (u.handleChangeCipherSpec = function (e, t) {
            if (1 !== t.fragment.getByte())
              return e.error(e, {
                message: "Invalid ChangeCipherSpec message received.",
                send: !0,
                alert: {
                  level: u.Alert.Level.fatal,
                  description: u.Alert.Description.illegal_parameter,
                },
              });
            var r = e.entity === u.ConnectionEnd.client;
            ((e.session.resuming && r) || (!e.session.resuming && !r)) &&
              (e.state.pending = u.createConnectionState(e)),
              (e.state.current.read = e.state.pending.read),
              ((!e.session.resuming && r) || (e.session.resuming && !r)) &&
                (e.state.pending = null),
              (e.expect = r ? d : E),
              e.process();
          }),
          (u.handleFinished = function (e, t, r) {
            var a = t.fragment;
            a.read -= 4;
            var s = a.bytes();
            a.read += 4;
            var o = t.fragment.getBytes();
            (a = n.util.createBuffer()).putBuffer(e.session.md5.digest()),
              a.putBuffer(e.session.sha1.digest());
            var c = e.entity === u.ConnectionEnd.client;
            if (
              (a = i(
                e.session.sp.master_secret,
                c ? "server finished" : "client finished",
                a.getBytes(),
                12
              )).getBytes() !== o
            )
              return e.error(e, {
                message: "Invalid verify_data in Finished message.",
                send: !0,
                alert: {
                  level: u.Alert.Level.fatal,
                  description: u.Alert.Description.decrypt_error,
                },
              });
            e.session.md5.update(s),
              e.session.sha1.update(s),
              ((e.session.resuming && c) || (!e.session.resuming && !c)) &&
                (u.queue(
                  e,
                  u.createRecord(e, {
                    type: u.ContentType.change_cipher_spec,
                    data: u.createChangeCipherSpec(),
                  })
                ),
                (e.state.current.write = e.state.pending.write),
                (e.state.pending = null),
                u.queue(
                  e,
                  u.createRecord(e, {
                    type: u.ContentType.handshake,
                    data: u.createFinished(e),
                  })
                )),
              (e.expect = c ? $ : S),
              (e.handshaking = !1),
              ++e.handshakes,
              (e.peerCertificate = c
                ? e.session.serverCertificate
                : e.session.clientCertificate),
              u.flush(e),
              (e.isConnected = !0),
              e.connected(e),
              e.process();
          }),
          (u.handleAlert = function (e, t) {
            var r,
              n = t.fragment,
              i = { level: n.getByte(), description: n.getByte() };
            switch (i.description) {
              case u.Alert.Description.close_notify:
                r = "Connection closed.";
                break;
              case u.Alert.Description.unexpected_message:
                r = "Unexpected message.";
                break;
              case u.Alert.Description.bad_record_mac:
                r = "Bad record MAC.";
                break;
              case u.Alert.Description.decryption_failed:
                r = "Decryption failed.";
                break;
              case u.Alert.Description.record_overflow:
                r = "Record overflow.";
                break;
              case u.Alert.Description.decompression_failure:
                r = "Decompression failed.";
                break;
              case u.Alert.Description.handshake_failure:
                r = "Handshake failure.";
                break;
              case u.Alert.Description.bad_certificate:
                r = "Bad certificate.";
                break;
              case u.Alert.Description.unsupported_certificate:
                r = "Unsupported certificate.";
                break;
              case u.Alert.Description.certificate_revoked:
                r = "Certificate revoked.";
                break;
              case u.Alert.Description.certificate_expired:
                r = "Certificate expired.";
                break;
              case u.Alert.Description.certificate_unknown:
                r = "Certificate unknown.";
                break;
              case u.Alert.Description.illegal_parameter:
                r = "Illegal parameter.";
                break;
              case u.Alert.Description.unknown_ca:
                r = "Unknown certificate authority.";
                break;
              case u.Alert.Description.access_denied:
                r = "Access denied.";
                break;
              case u.Alert.Description.decode_error:
                r = "Decode error.";
                break;
              case u.Alert.Description.decrypt_error:
                r = "Decrypt error.";
                break;
              case u.Alert.Description.export_restriction:
                r = "Export restriction.";
                break;
              case u.Alert.Description.protocol_version:
                r = "Unsupported protocol version.";
                break;
              case u.Alert.Description.insufficient_security:
                r = "Insufficient security.";
                break;
              case u.Alert.Description.internal_error:
                r = "Internal error.";
                break;
              case u.Alert.Description.user_canceled:
                r = "User canceled.";
                break;
              case u.Alert.Description.no_renegotiation:
                r = "Renegotiation not supported.";
                break;
              default:
                r = "Unknown error.";
            }
            if (i.description === u.Alert.Description.close_notify)
              return e.close();
            e.error(e, {
              message: r,
              send: !1,
              origin: e.entity === u.ConnectionEnd.client ? "server" : "client",
              alert: i,
            }),
              e.process();
          }),
          (u.handleHandshake = function (e, t) {
            var r = t.fragment,
              i = r.getByte(),
              a = r.getInt24();
            if (a > r.length())
              return (
                (e.fragmented = t),
                (t.fragment = n.util.createBuffer()),
                (r.read -= 4),
                e.process()
              );
            (e.fragmented = null), (r.read -= 4);
            var s = r.bytes(a + 4);
            (r.read += 4),
              i in O[e.entity][e.expect]
                ? (e.entity !== u.ConnectionEnd.server ||
                    e.open ||
                    e.fail ||
                    ((e.handshaking = !0),
                    (e.session = {
                      version: null,
                      extensions: { server_name: { serverNameList: [] } },
                      cipherSuite: null,
                      compressionMethod: null,
                      serverCertificate: null,
                      clientCertificate: null,
                      md5: n.md.md5.create(),
                      sha1: n.md.sha1.create(),
                    })),
                  i !== u.HandshakeType.hello_request &&
                    i !== u.HandshakeType.certificate_verify &&
                    i !== u.HandshakeType.finished &&
                    (e.session.md5.update(s), e.session.sha1.update(s)),
                  O[e.entity][e.expect][i](e, t, a))
                : u.handleUnexpected(e, t);
          }),
          (u.handleApplicationData = function (e, t) {
            e.data.putBuffer(t.fragment), e.dataReady(e), e.process();
          }),
          (u.handleHeartbeat = function (e, t) {
            var r = t.fragment,
              i = r.getByte(),
              a = r.getInt16(),
              s = r.getBytes(a);
            if (i === u.HeartbeatMessageType.heartbeat_request) {
              if (e.handshaking || a > s.length) return e.process();
              u.queue(
                e,
                u.createRecord(e, {
                  type: u.ContentType.heartbeat,
                  data: u.createHeartbeat(
                    u.HeartbeatMessageType.heartbeat_response,
                    s
                  ),
                })
              ),
                u.flush(e);
            } else if (i === u.HeartbeatMessageType.heartbeat_response) {
              if (s !== e.expectedHeartbeatPayload) return e.process();
              e.heartbeatReceived &&
                e.heartbeatReceived(e, n.util.createBuffer(s));
            }
            e.process();
          });
        var l = 1,
          _ = 2,
          p = 3,
          f = 4,
          h = 5,
          d = 6,
          $ = 7,
          g = 8,
          y = 1,
          m = 2,
          v = 3,
          C = 4,
          E = 5,
          S = 6,
          b = u.handleUnexpected,
          T = u.handleChangeCipherSpec,
          I = u.handleAlert,
          A = u.handleHandshake,
          B = u.handleApplicationData,
          k = u.handleHeartbeat,
          N = [];
        (N[u.ConnectionEnd.client] = [
          [b, I, A, b, k],
          [b, I, A, b, k],
          [b, I, A, b, k],
          [b, I, A, b, k],
          [b, I, A, b, k],
          [T, I, b, b, k],
          [b, I, A, b, k],
          [b, I, A, B, k],
          [b, I, A, b, k],
        ]),
          (N[u.ConnectionEnd.server] = [
            [b, I, A, b, k],
            [b, I, A, b, k],
            [b, I, A, b, k],
            [b, I, A, b, k],
            [T, I, b, b, k],
            [b, I, A, b, k],
            [b, I, A, B, k],
            [b, I, A, b, k],
          ]);
        var R = u.handleHelloRequest,
          L = u.handleServerHello,
          w = u.handleCertificate,
          U = u.handleServerKeyExchange,
          D = u.handleCertificateRequest,
          P = u.handleServerHelloDone,
          V = u.handleFinished,
          O = [];
        O[u.ConnectionEnd.client] = [
          [b, b, L, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b],
          [R, b, b, b, b, b, b, b, b, b, b, w, U, D, P, b, b, b, b, b, b],
          [R, b, b, b, b, b, b, b, b, b, b, b, U, D, P, b, b, b, b, b, b],
          [R, b, b, b, b, b, b, b, b, b, b, b, b, D, P, b, b, b, b, b, b],
          [R, b, b, b, b, b, b, b, b, b, b, b, b, b, P, b, b, b, b, b, b],
          [R, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b],
          [R, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, V],
          [R, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b],
          [R, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b],
        ];
        var x = u.handleClientHello,
          K = u.handleClientKeyExchange,
          M = u.handleCertificateVerify;
        (O[u.ConnectionEnd.server] = [
          [b, x, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b],
          [b, b, b, b, b, b, b, b, b, b, b, w, b, b, b, b, b, b, b, b, b],
          [b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, K, b, b, b, b],
          [b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, M, b, b, b, b, b],
          [b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b],
          [b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, V],
          [b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b],
          [b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b],
        ]),
          (u.generateKeys = function (e, t) {
            var r = i,
              n = t.client_random + t.server_random;
            e.session.resuming ||
              ((t.master_secret = r(
                t.pre_master_secret,
                "master secret",
                n,
                48
              ).bytes()),
              (t.pre_master_secret = null)),
              (n = t.server_random + t.client_random);
            var a = 2 * t.mac_key_length + 2 * t.enc_key_length,
              s =
                e.version.major === u.Versions.TLS_1_0.major &&
                e.version.minor === u.Versions.TLS_1_0.minor;
            s && (a += 2 * t.fixed_iv_length);
            var o = r(t.master_secret, "key expansion", n, a),
              c = {
                client_write_MAC_key: o.getBytes(t.mac_key_length),
                server_write_MAC_key: o.getBytes(t.mac_key_length),
                client_write_key: o.getBytes(t.enc_key_length),
                server_write_key: o.getBytes(t.enc_key_length),
              };
            return (
              s &&
                ((c.client_write_IV = o.getBytes(t.fixed_iv_length)),
                (c.server_write_IV = o.getBytes(t.fixed_iv_length))),
              c
            );
          }),
          (u.createConnectionState = function (e) {
            var t = e.entity === u.ConnectionEnd.client,
              r = function () {
                var e = {
                  sequenceNumber: [0, 0],
                  macKey: null,
                  macLength: 0,
                  macFunction: null,
                  cipherState: null,
                  cipherFunction: function (e) {
                    return !0;
                  },
                  compressionState: null,
                  compressFunction: function (e) {
                    return !0;
                  },
                  updateSequenceNumber: function () {
                    4294967295 === e.sequenceNumber[1]
                      ? ((e.sequenceNumber[1] = 0), ++e.sequenceNumber[0])
                      : ++e.sequenceNumber[1];
                  },
                };
                return e;
              },
              n = { read: r(), write: r() };
            if (
              ((n.read.update = function (e, t) {
                return (
                  n.read.cipherFunction(t, n.read)
                    ? n.read.compressFunction(e, t, n.read) ||
                      e.error(e, {
                        message: "Could not decompress record.",
                        send: !0,
                        alert: {
                          level: u.Alert.Level.fatal,
                          description:
                            u.Alert.Description.decompression_failure,
                        },
                      })
                    : e.error(e, {
                        message: "Could not decrypt record or bad MAC.",
                        send: !0,
                        alert: {
                          level: u.Alert.Level.fatal,
                          description: u.Alert.Description.bad_record_mac,
                        },
                      }),
                  !e.fail
                );
              }),
              (n.write.update = function (e, t) {
                return (
                  n.write.compressFunction(e, t, n.write)
                    ? n.write.cipherFunction(t, n.write) ||
                      e.error(e, {
                        message: "Could not encrypt record.",
                        send: !1,
                        alert: {
                          level: u.Alert.Level.fatal,
                          description: u.Alert.Description.internal_error,
                        },
                      })
                    : e.error(e, {
                        message: "Could not compress record.",
                        send: !1,
                        alert: {
                          level: u.Alert.Level.fatal,
                          description: u.Alert.Description.internal_error,
                        },
                      }),
                  !e.fail
                );
              }),
              e.session)
            ) {
              var i = e.session.sp;
              switch (
                (e.session.cipherSuite.initSecurityParameters(i),
                (i.keys = u.generateKeys(e, i)),
                (n.read.macKey = t
                  ? i.keys.server_write_MAC_key
                  : i.keys.client_write_MAC_key),
                (n.write.macKey = t
                  ? i.keys.client_write_MAC_key
                  : i.keys.server_write_MAC_key),
                e.session.cipherSuite.initConnectionState(n, e, i),
                i.compression_algorithm)
              ) {
                case u.CompressionMethod.none:
                  break;
                case u.CompressionMethod.deflate:
                  (n.read.compressFunction = s), (n.write.compressFunction = a);
                  break;
                default:
                  throw Error("Unsupported compression algorithm.");
              }
            }
            return n;
          }),
          (u.createRandom = function () {
            var e = new Date(),
              t = +e + 6e4 * e.getTimezoneOffset(),
              r = n.util.createBuffer();
            return r.putInt32(t), r.putBytes(n.random.getBytes(28)), r;
          }),
          (u.createRecord = function (e, t) {
            return t.data
              ? {
                  type: t.type,
                  version: { major: e.version.major, minor: e.version.minor },
                  length: t.data.length(),
                  fragment: t.data,
                }
              : null;
          }),
          (u.createAlert = function (e, t) {
            var r = n.util.createBuffer();
            return (
              r.putByte(t.level),
              r.putByte(t.description),
              u.createRecord(e, { type: u.ContentType.alert, data: r })
            );
          }),
          (u.createClientHello = function (e) {
            e.session.clientHelloVersion = {
              major: e.version.major,
              minor: e.version.minor,
            };
            for (
              var t = n.util.createBuffer(), r = 0;
              r < e.cipherSuites.length;
              ++r
            ) {
              var i = e.cipherSuites[r];
              t.putByte(i.id[0]), t.putByte(i.id[1]);
            }
            var a = t.length(),
              s = n.util.createBuffer();
            s.putByte(u.CompressionMethod.none);
            var o = s.length(),
              l = n.util.createBuffer();
            if (e.virtualHost) {
              var _ = n.util.createBuffer();
              _.putByte(0), _.putByte(0);
              var p = n.util.createBuffer();
              p.putByte(0), c(p, 2, n.util.createBuffer(e.virtualHost));
              var f = n.util.createBuffer();
              c(f, 2, p), c(_, 2, f), l.putBuffer(_);
            }
            var h = l.length();
            h > 0 && (h += 2);
            var d = e.session.id,
              $ = d.length + 1 + 2 + 4 + 28 + 2 + a + 1 + o + h,
              g = n.util.createBuffer();
            return (
              g.putByte(u.HandshakeType.client_hello),
              g.putInt24($),
              g.putByte(e.version.major),
              g.putByte(e.version.minor),
              g.putBytes(e.session.sp.client_random),
              c(g, 1, n.util.createBuffer(d)),
              c(g, 2, t),
              c(g, 1, s),
              h > 0 && c(g, 2, l),
              g
            );
          }),
          (u.createServerHello = function (e) {
            var t = e.session.id,
              r = t.length + 1 + 2 + 4 + 28 + 2 + 1,
              i = n.util.createBuffer();
            return (
              i.putByte(u.HandshakeType.server_hello),
              i.putInt24(r),
              i.putByte(e.version.major),
              i.putByte(e.version.minor),
              i.putBytes(e.session.sp.server_random),
              c(i, 1, n.util.createBuffer(t)),
              i.putByte(e.session.cipherSuite.id[0]),
              i.putByte(e.session.cipherSuite.id[1]),
              i.putByte(e.session.compressionMethod),
              i
            );
          }),
          (u.createCertificate = function (e) {
            var t,
              r = e.entity === u.ConnectionEnd.client,
              i = null;
            e.getCertificate &&
              ((t = r
                ? e.session.certificateRequest
                : e.session.extensions.server_name.serverNameList),
              (i = e.getCertificate(e, t)));
            var a = n.util.createBuffer();
            if (null !== i)
              try {
                n.util.isArray(i) || (i = [i]);
                for (var s = null, o = 0; o < i.length; ++o) {
                  var l = n.pem.decode(i[o])[0];
                  if (
                    "CERTIFICATE" !== l.type &&
                    "X509 CERTIFICATE" !== l.type &&
                    "TRUSTED CERTIFICATE" !== l.type
                  ) {
                    var _ = Error(
                      'Could not convert certificate from PEM; PEM header type is not "CERTIFICATE", "X509 CERTIFICATE", or "TRUSTED CERTIFICATE".'
                    );
                    throw ((_.headerType = l.type), _);
                  }
                  if (l.procType && "ENCRYPTED" === l.procType.type)
                    throw Error(
                      "Could not convert certificate from PEM; PEM is encrypted."
                    );
                  var p = n.util.createBuffer(l.body);
                  null === s && (s = n.asn1.fromDer(p.bytes(), !1));
                  var f = n.util.createBuffer();
                  c(f, 3, p), a.putBuffer(f);
                }
                (i = n.pki.certificateFromAsn1(s)),
                  r
                    ? (e.session.clientCertificate = i)
                    : (e.session.serverCertificate = i);
              } catch (h) {
                return e.error(e, {
                  message: "Could not send certificate list.",
                  cause: h,
                  send: !0,
                  alert: {
                    level: u.Alert.Level.fatal,
                    description: u.Alert.Description.bad_certificate,
                  },
                });
              }
            var d = 3 + a.length(),
              $ = n.util.createBuffer();
            return (
              $.putByte(u.HandshakeType.certificate),
              $.putInt24(d),
              c($, 3, a),
              $
            );
          }),
          (u.createClientKeyExchange = function (e) {
            var t = n.util.createBuffer();
            t.putByte(e.session.clientHelloVersion.major),
              t.putByte(e.session.clientHelloVersion.minor),
              t.putBytes(n.random.getBytes(46));
            var r = e.session.sp;
            r.pre_master_secret = t.getBytes();
            var i =
                (t = e.session.serverCertificate.publicKey.encrypt(
                  r.pre_master_secret
                )).length + 2,
              a = n.util.createBuffer();
            return (
              a.putByte(u.HandshakeType.client_key_exchange),
              a.putInt24(i),
              a.putInt16(t.length),
              a.putBytes(t),
              a
            );
          }),
          (u.createServerKeyExchange = function (e) {
            return n.util.createBuffer();
          }),
          (u.getClientSignature = function (e, t) {
            var r = n.util.createBuffer();
            r.putBuffer(e.session.md5.digest()),
              r.putBuffer(e.session.sha1.digest()),
              (r = r.getBytes()),
              (e.getSignature =
                e.getSignature ||
                function (e, t, r) {
                  var i = null;
                  if (e.getPrivateKey)
                    try {
                      (i = e.getPrivateKey(e, e.session.clientCertificate)),
                        (i = n.pki.privateKeyFromPem(i));
                    } catch (a) {
                      e.error(e, {
                        message: "Could not get private key.",
                        cause: a,
                        send: !0,
                        alert: {
                          level: u.Alert.Level.fatal,
                          description: u.Alert.Description.internal_error,
                        },
                      });
                    }
                  null === i
                    ? e.error(e, {
                        message: "No private key set.",
                        send: !0,
                        alert: {
                          level: u.Alert.Level.fatal,
                          description: u.Alert.Description.internal_error,
                        },
                      })
                    : (t = i.sign(t, null)),
                    r(e, t);
                }),
              e.getSignature(e, r, t);
          }),
          (u.createCertificateVerify = function (e, t) {
            var r = t.length + 2,
              i = n.util.createBuffer();
            return (
              i.putByte(u.HandshakeType.certificate_verify),
              i.putInt24(r),
              i.putInt16(t.length),
              i.putBytes(t),
              i
            );
          }),
          (u.createCertificateRequest = function (e) {
            var t = n.util.createBuffer();
            t.putByte(1);
            var r = n.util.createBuffer();
            for (var i in e.caStore.certs) {
              var a = e.caStore.certs[i],
                s = n.pki.distinguishedNameToAsn1(a.subject),
                o = n.asn1.toDer(s);
              r.putInt16(o.length()), r.putBuffer(o);
            }
            var l = 1 + t.length() + 2 + r.length(),
              _ = n.util.createBuffer();
            return (
              _.putByte(u.HandshakeType.certificate_request),
              _.putInt24(l),
              c(_, 1, t),
              c(_, 2, r),
              _
            );
          }),
          (u.createServerHelloDone = function (e) {
            var t = n.util.createBuffer();
            return (
              t.putByte(u.HandshakeType.server_hello_done), t.putInt24(0), t
            );
          }),
          (u.createChangeCipherSpec = function () {
            var e = n.util.createBuffer();
            return e.putByte(1), e;
          }),
          (u.createFinished = function (e) {
            var t = n.util.createBuffer();
            t.putBuffer(e.session.md5.digest()),
              t.putBuffer(e.session.sha1.digest());
            var r = e.entity === u.ConnectionEnd.client;
            t = i(
              e.session.sp.master_secret,
              r ? "client finished" : "server finished",
              t.getBytes(),
              12
            );
            var a = n.util.createBuffer();
            return (
              a.putByte(u.HandshakeType.finished),
              a.putInt24(t.length()),
              a.putBuffer(t),
              a
            );
          }),
          (u.createHeartbeat = function (e, t, r) {
            void 0 === r && (r = t.length);
            var i = n.util.createBuffer();
            i.putByte(e), i.putInt16(r), i.putBytes(t);
            var a = Math.max(16, i.length() - r - 3);
            return i.putBytes(n.random.getBytes(a)), i;
          }),
          (u.queue = function (e, t) {
            if (
              t &&
              (0 !== t.fragment.length() ||
                (t.type !== u.ContentType.handshake &&
                  t.type !== u.ContentType.alert &&
                  t.type !== u.ContentType.change_cipher_spec))
            ) {
              if (t.type === u.ContentType.handshake) {
                var r,
                  i = t.fragment.bytes();
                e.session.md5.update(i), e.session.sha1.update(i), (i = null);
              }
              if (t.fragment.length() <= u.MaxFragment) r = [t];
              else {
                r = [];
                for (var a = t.fragment.bytes(); a.length > u.MaxFragment; )
                  r.push(
                    u.createRecord(e, {
                      type: t.type,
                      data: n.util.createBuffer(a.slice(0, u.MaxFragment)),
                    })
                  ),
                    (a = a.slice(u.MaxFragment));
                a.length > 0 &&
                  r.push(
                    u.createRecord(e, {
                      type: t.type,
                      data: n.util.createBuffer(a),
                    })
                  );
              }
              for (var s = 0; s < r.length && !e.fail; ++s) {
                var o = r[s];
                e.state.current.write.update(e, o) && e.records.push(o);
              }
            }
          }),
          (u.flush = function (e) {
            for (var t = 0; t < e.records.length; ++t) {
              var r = e.records[t];
              e.tlsData.putByte(r.type),
                e.tlsData.putByte(r.version.major),
                e.tlsData.putByte(r.version.minor),
                e.tlsData.putInt16(r.fragment.length()),
                e.tlsData.putBuffer(e.records[t].fragment);
            }
            return (e.records = []), e.tlsDataReady(e);
          });
        var F = function (e) {
          switch (e) {
            case !0:
              return !0;
            case n.pki.certificateError.bad_certificate:
              return u.Alert.Description.bad_certificate;
            case n.pki.certificateError.unsupported_certificate:
              return u.Alert.Description.unsupported_certificate;
            case n.pki.certificateError.certificate_revoked:
              return u.Alert.Description.certificate_revoked;
            case n.pki.certificateError.certificate_expired:
              return u.Alert.Description.certificate_expired;
            case n.pki.certificateError.certificate_unknown:
              return u.Alert.Description.certificate_unknown;
            case n.pki.certificateError.unknown_ca:
              return u.Alert.Description.unknown_ca;
            default:
              return u.Alert.Description.bad_certificate;
          }
        };
        for (var j in ((u.verifyCertificateChain = function (e, t) {
          try {
            var r = {};
            for (var i in e.verifyOptions) r[i] = e.verifyOptions[i];
            (r.verify = function (t, r, i) {
              F(t);
              var a = e.verify(e, t, r, i);
              if (!0 !== a) {
                if ("object" == typeof a && !n.util.isArray(a)) {
                  var s = Error("The application rejected the certificate.");
                  throw (
                    ((s.send = !0),
                    (s.alert = {
                      level: u.Alert.Level.fatal,
                      description: u.Alert.Description.bad_certificate,
                    }),
                    a.message && (s.message = a.message),
                    a.alert && (s.alert.description = a.alert),
                    s)
                  );
                }
                a !== t &&
                  (a = (function (e) {
                    switch (e) {
                      case !0:
                        return !0;
                      case u.Alert.Description.bad_certificate:
                        return n.pki.certificateError.bad_certificate;
                      case u.Alert.Description.unsupported_certificate:
                        return n.pki.certificateError.unsupported_certificate;
                      case u.Alert.Description.certificate_revoked:
                        return n.pki.certificateError.certificate_revoked;
                      case u.Alert.Description.certificate_expired:
                        return n.pki.certificateError.certificate_expired;
                      case u.Alert.Description.certificate_unknown:
                        return n.pki.certificateError.certificate_unknown;
                      case u.Alert.Description.unknown_ca:
                        return n.pki.certificateError.unknown_ca;
                      default:
                        return n.pki.certificateError.bad_certificate;
                    }
                  })(a));
              }
              return a;
            }),
              n.pki.verifyCertificateChain(e.caStore, t, r);
          } catch (a) {
            var s = a;
            ("object" != typeof s || n.util.isArray(s)) &&
              (s = {
                send: !0,
                alert: { level: u.Alert.Level.fatal, description: F(a) },
              }),
              "send" in s || (s.send = !0),
              "alert" in s ||
                (s.alert = {
                  level: u.Alert.Level.fatal,
                  description: F(s.error),
                }),
              e.error(e, s);
          }
          return !e.fail;
        }),
        (u.createSessionCache = function (e, t) {
          var r = null;
          if (e && e.getSession && e.setSession && e.order) r = e;
          else {
            for (var i in (((r = {}).cache = e || {}),
            (r.capacity = Math.max(t || 100, 1)),
            (r.order = []),
            e))
              r.order.length <= t ? r.order.push(i) : delete e[i];
            (r.getSession = function (e) {
              var t = null,
                i = null;
              if (
                (e
                  ? (i = n.util.bytesToHex(e))
                  : r.order.length > 0 && (i = r.order[0]),
                null !== i && i in r.cache)
              ) {
                for (var a in ((t = r.cache[i]), delete r.cache[i], r.order))
                  if (r.order[a] === i) {
                    r.order.splice(a, 1);
                    break;
                  }
              }
              return t;
            }),
              (r.setSession = function (e, t) {
                if (r.order.length === r.capacity) {
                  var i = r.order.shift();
                  delete r.cache[i];
                }
                (i = n.util.bytesToHex(e)), r.order.push(i), (r.cache[i] = t);
              });
          }
          return r;
        }),
        (u.createConnection = function (e) {
          var t = null;
          t = e.caStore
            ? n.util.isArray(e.caStore)
              ? n.pki.createCaStore(e.caStore)
              : e.caStore
            : n.pki.createCaStore();
          var r = e.cipherSuites || null;
          if (null === r)
            for (var i in ((r = []), u.CipherSuites)) r.push(u.CipherSuites[i]);
          var a = e.server ? u.ConnectionEnd.server : u.ConnectionEnd.client,
            s = e.sessionCache ? u.createSessionCache(e.sessionCache) : null,
            o = {
              version: { major: u.Version.major, minor: u.Version.minor },
              entity: a,
              sessionId: e.sessionId,
              caStore: t,
              sessionCache: s,
              cipherSuites: r,
              connected: e.connected,
              virtualHost: e.virtualHost || null,
              verifyClient: e.verifyClient || !1,
              verify:
                e.verify ||
                function (e, t, r, n) {
                  return t;
                },
              verifyOptions: e.verifyOptions || {},
              getCertificate: e.getCertificate || null,
              getPrivateKey: e.getPrivateKey || null,
              getSignature: e.getSignature || null,
              input: n.util.createBuffer(),
              tlsData: n.util.createBuffer(),
              data: n.util.createBuffer(),
              tlsDataReady: e.tlsDataReady,
              dataReady: e.dataReady,
              heartbeatReceived: e.heartbeatReceived,
              closed: e.closed,
              error: function (t, r) {
                (r.origin =
                  r.origin ||
                  (t.entity === u.ConnectionEnd.client ? "client" : "server")),
                  r.send && (u.queue(t, u.createAlert(t, r.alert)), u.flush(t));
                var n = !1 !== r.fatal;
                n && (t.fail = !0), e.error(t, r), n && t.close(!1);
              },
              deflate: e.deflate || null,
              inflate: e.inflate || null,
              reset: function (e) {
                (o.version = {
                  major: u.Version.major,
                  minor: u.Version.minor,
                }),
                  (o.record = null),
                  (o.session = null),
                  (o.peerCertificate = null),
                  (o.state = { pending: null, current: null }),
                  (o.expect = (o.entity, u.ConnectionEnd.client, 0)),
                  (o.fragmented = null),
                  (o.records = []),
                  (o.open = !1),
                  (o.handshakes = 0),
                  (o.handshaking = !1),
                  (o.isConnected = !1),
                  (o.fail = !(e || void 0 === e)),
                  o.input.clear(),
                  o.tlsData.clear(),
                  o.data.clear(),
                  (o.state.current = u.createConnectionState(o));
              },
            };
          return (
            o.reset(),
            (o.handshake = function (e) {
              if (o.entity !== u.ConnectionEnd.client)
                o.error(o, {
                  message: "Cannot initiate handshake as a server.",
                  fatal: !1,
                });
              else if (o.handshaking)
                o.error(o, {
                  message: "Handshake already in progress.",
                  fatal: !1,
                });
              else {
                o.fail && !o.open && 0 === o.handshakes && (o.fail = !1),
                  (o.handshaking = !0);
                var t = null;
                (e = e || "").length > 0 &&
                  (o.sessionCache && (t = o.sessionCache.getSession(e)),
                  null === t && (e = "")),
                  0 === e.length &&
                    o.sessionCache &&
                    null !== (t = o.sessionCache.getSession()) &&
                    (e = t.id),
                  (o.session = {
                    id: e,
                    version: null,
                    cipherSuite: null,
                    compressionMethod: null,
                    serverCertificate: null,
                    certificateRequest: null,
                    clientCertificate: null,
                    sp: {},
                    md5: n.md.md5.create(),
                    sha1: n.md.sha1.create(),
                  }),
                  t && ((o.version = t.version), (o.session.sp = t.sp)),
                  (o.session.sp.client_random = u.createRandom().getBytes()),
                  (o.open = !0),
                  u.queue(
                    o,
                    u.createRecord(o, {
                      type: u.ContentType.handshake,
                      data: u.createClientHello(o),
                    })
                  ),
                  u.flush(o);
              }
            }),
            (o.process = function (e) {
              var t,
                r,
                i,
                a,
                s,
                c,
                l,
                _,
                p = 0;
              return (
                e && o.input.putBytes(e),
                o.fail ||
                  (null !== o.record &&
                    o.record.ready &&
                    o.record.fragment.isEmpty() &&
                    (o.record = null),
                  null === o.record &&
                    (p = (function (e) {
                      var t = 0,
                        r = e.input,
                        i = r.length();
                      if (i < 5) t = 5 - i;
                      else {
                        e.record = {
                          type: r.getByte(),
                          version: { major: r.getByte(), minor: r.getByte() },
                          length: r.getInt16(),
                          fragment: n.util.createBuffer(),
                          ready: !1,
                        };
                        var a = e.record.version.major === e.version.major;
                        a &&
                          e.session &&
                          e.session.version &&
                          (a = e.record.version.minor === e.version.minor),
                          a ||
                            e.error(e, {
                              message: "Incompatible TLS version.",
                              send: !0,
                              alert: {
                                level: u.Alert.Level.fatal,
                                description:
                                  u.Alert.Description.protocol_version,
                              },
                            });
                      }
                      return t;
                    })(o)),
                  o.fail ||
                    null === o.record ||
                    o.record.ready ||
                    (p =
                      ((r = 0),
                      (a = (i = (t = o).input).length()) < t.record.length
                        ? (r = t.record.length - a)
                        : (t.record.fragment.putBytes(
                            i.getBytes(t.record.length)
                          ),
                          i.compact(),
                          t.state.current.read.update(t, t.record) &&
                            (null !== t.fragmented &&
                              (t.fragmented.type === t.record.type
                                ? (t.fragmented.fragment.putBuffer(
                                    t.record.fragment
                                  ),
                                  (t.record = t.fragmented))
                                : t.error(t, {
                                    message: "Invalid fragmented record.",
                                    send: !0,
                                    alert: {
                                      level: u.Alert.Level.fatal,
                                      description:
                                        u.Alert.Description.unexpected_message,
                                    },
                                  })),
                            (t.record.ready = !0))),
                      r)),
                  !o.fail &&
                    null !== o.record &&
                    o.record.ready &&
                    ((s = o),
                    (l =
                      (c = o.record).type - u.ContentType.change_cipher_spec),
                    l in (_ = N[s.entity][s.expect])
                      ? _[l](s, c)
                      : u.handleUnexpected(s, c))),
                p
              );
            }),
            (o.prepare = function (e) {
              return (
                u.queue(
                  o,
                  u.createRecord(o, {
                    type: u.ContentType.application_data,
                    data: n.util.createBuffer(e),
                  })
                ),
                u.flush(o)
              );
            }),
            (o.prepareHeartbeatRequest = function (e, t) {
              return (
                e instanceof n.util.ByteBuffer && (e = e.bytes()),
                void 0 === t && (t = e.length),
                (o.expectedHeartbeatPayload = e),
                u.queue(
                  o,
                  u.createRecord(o, {
                    type: u.ContentType.heartbeat,
                    data: u.createHeartbeat(
                      u.HeartbeatMessageType.heartbeat_request,
                      e,
                      t
                    ),
                  })
                ),
                u.flush(o)
              );
            }),
            (o.close = function (e) {
              if (!o.fail && o.sessionCache && o.session) {
                var t = {
                  id: o.session.id,
                  version: o.session.version,
                  sp: o.session.sp,
                };
                (t.sp.keys = null), o.sessionCache.setSession(t.id, t);
              }
              o.open &&
                ((o.open = !1),
                o.input.clear(),
                (o.isConnected || o.handshaking) &&
                  ((o.isConnected = o.handshaking = !1),
                  u.queue(
                    o,
                    u.createAlert(o, {
                      level: u.Alert.Level.warning,
                      description: u.Alert.Description.close_notify,
                    })
                  ),
                  u.flush(o)),
                o.closed(o)),
                o.reset(e);
            }),
            o
          );
        }),
        (t.exports = n.tls = n.tls || {}),
        u))
          "function" != typeof u[j] && (n.tls[j] = u[j]);
        (n.tls.prf_tls1 = i),
          (n.tls.hmac_sha1 = function (e, t, r) {
            var i = n.hmac.create();
            i.start("SHA1", e);
            var a = n.util.createBuffer();
            return (
              a.putInt32(t[0]),
              a.putInt32(t[1]),
              a.putByte(r.type),
              a.putByte(r.version.major),
              a.putByte(r.version.minor),
              a.putInt16(r.length),
              a.putBytes(r.fragment.bytes()),
              i.update(a.getBytes()),
              i.digest().getBytes()
            );
          }),
          (n.tls.createSessionCache = u.createSessionCache),
          (n.tls.createConnection = u.createConnection);
      },
      {
        "./asn1": 9,
        "./forge": 16,
        "./hmac": 17,
        "./md5": 24,
        "./pem": 30,
        "./pki": 35,
        "./random": 39,
        "./sha1": 42,
        "./util": 48,
      },
    ],
    48: [
      function (e, t, r) {
        (function (r, n, i, a, s, o, c, u) {
          var l = e("./forge"),
            _ = e("./baseN"),
            p = (t.exports = l.util = l.util || {});
          function f(e) {
            if (8 !== e && 16 !== e && 24 !== e && 32 !== e)
              throw Error("Only 8, 16, 24, or 32 bits supported: " + e);
          }
          function h(e) {
            if (((this.data = ""), (this.read = 0), "string" == typeof e))
              this.data = e;
            else if (p.isArrayBuffer(e) || p.isArrayBufferView(e)) {
              if (void 0 !== i && e instanceof i)
                this.data = e.toString("binary");
              else {
                var t = new Uint8Array(e);
                try {
                  this.data = String.fromCharCode.apply(null, t);
                } catch (r) {
                  for (var n = 0; n < t.length; ++n) this.putByte(t[n]);
                }
              }
            } else
              (e instanceof h ||
                ("object" == typeof e &&
                  "string" == typeof e.data &&
                  "number" == typeof e.read)) &&
                ((this.data = e.data), (this.read = e.read));
            this._constructedStringLength = 0;
          }
          (function () {
            if (void 0 !== r && r.nextTick && !r.browser)
              return (
                (p.nextTick = r.nextTick),
                void (p.setImmediate = "function" == typeof u ? u : p.nextTick)
              );
            if ("function" == typeof u)
              return (
                (p.setImmediate = function () {
                  return u.apply(void 0, arguments);
                }),
                void (p.nextTick = function (e) {
                  return u(e);
                })
              );
            if (
              ((p.setImmediate = function (e) {
                setTimeout(e, 0);
              }),
              "undefined" != typeof window &&
                "function" == typeof window.postMessage)
            ) {
              var e = "forge.setImmediate",
                t = [];
              (p.setImmediate = function (r) {
                t.push(r), 1 === t.length && window.postMessage(e, "*");
              }),
                window.addEventListener(
                  "message",
                  function (r) {
                    if (r.source === window && r.data === e) {
                      r.stopPropagation();
                      var n = t.slice();
                      (t.length = 0),
                        n.forEach(function (e) {
                          e();
                        });
                    }
                  },
                  !0
                );
            }
            if ("undefined" != typeof MutationObserver) {
              var n = Date.now(),
                i = !0,
                a = document.createElement("div");
              (t = []),
                new MutationObserver(function () {
                  var e = t.slice();
                  (t.length = 0),
                    e.forEach(function (e) {
                      e();
                    });
                }).observe(a, { attributes: !0 });
              var s = p.setImmediate;
              p.setImmediate = function (e) {
                Date.now() - n > 15
                  ? ((n = Date.now()), s(e))
                  : (t.push(e),
                    1 === t.length && a.setAttribute("a", (i = !i)));
              };
            }
            p.nextTick = p.setImmediate;
          })(),
            (p.isNodejs = void 0 !== r && r.versions && r.versions.node),
            (p.globalScope = p.isNodejs
              ? n
              : "undefined" == typeof self
              ? window
              : self),
            (p.isArray =
              Array.isArray ||
              function (e) {
                return "[object Array]" === Object.prototype.toString.call(e);
              }),
            (p.isArrayBuffer = function (e) {
              return (
                "undefined" != typeof ArrayBuffer && e instanceof ArrayBuffer
              );
            }),
            (p.isArrayBufferView = function (e) {
              return e && p.isArrayBuffer(e.buffer) && void 0 !== e.byteLength;
            }),
            (p.ByteBuffer = h),
            (p.ByteStringBuffer = h),
            (p.ByteStringBuffer.prototype._optimizeConstructedString =
              function (e) {
                (this._constructedStringLength += e),
                  this._constructedStringLength > 4096 &&
                    (this.data.substr(0, 1),
                    (this._constructedStringLength = 0));
              }),
            (p.ByteStringBuffer.prototype.length = function () {
              return this.data.length - this.read;
            }),
            (p.ByteStringBuffer.prototype.isEmpty = function () {
              return 0 >= this.length();
            }),
            (p.ByteStringBuffer.prototype.putByte = function (e) {
              return this.putBytes(String.fromCharCode(e));
            }),
            (p.ByteStringBuffer.prototype.fillWithByte = function (e, t) {
              e = String.fromCharCode(e);
              for (var r = this.data; t > 0; )
                1 & t && (r += e), (t >>>= 1) > 0 && (e += e);
              return (this.data = r), this._optimizeConstructedString(t), this;
            }),
            (p.ByteStringBuffer.prototype.putBytes = function (e) {
              return (
                (this.data += e),
                this._optimizeConstructedString(e.length),
                this
              );
            }),
            (p.ByteStringBuffer.prototype.putString = function (e) {
              return this.putBytes(p.encodeUtf8(e));
            }),
            (p.ByteStringBuffer.prototype.putInt16 = function (e) {
              return this.putBytes(
                String.fromCharCode((e >> 8) & 255) +
                  String.fromCharCode(255 & e)
              );
            }),
            (p.ByteStringBuffer.prototype.putInt24 = function (e) {
              return this.putBytes(
                String.fromCharCode((e >> 16) & 255) +
                  String.fromCharCode((e >> 8) & 255) +
                  String.fromCharCode(255 & e)
              );
            }),
            (p.ByteStringBuffer.prototype.putInt32 = function (e) {
              return this.putBytes(
                String.fromCharCode((e >> 24) & 255) +
                  String.fromCharCode((e >> 16) & 255) +
                  String.fromCharCode((e >> 8) & 255) +
                  String.fromCharCode(255 & e)
              );
            }),
            (p.ByteStringBuffer.prototype.putInt16Le = function (e) {
              return this.putBytes(
                String.fromCharCode(255 & e) +
                  String.fromCharCode((e >> 8) & 255)
              );
            }),
            (p.ByteStringBuffer.prototype.putInt24Le = function (e) {
              return this.putBytes(
                String.fromCharCode(255 & e) +
                  String.fromCharCode((e >> 8) & 255) +
                  String.fromCharCode((e >> 16) & 255)
              );
            }),
            (p.ByteStringBuffer.prototype.putInt32Le = function (e) {
              return this.putBytes(
                String.fromCharCode(255 & e) +
                  String.fromCharCode((e >> 8) & 255) +
                  String.fromCharCode((e >> 16) & 255) +
                  String.fromCharCode((e >> 24) & 255)
              );
            }),
            (p.ByteStringBuffer.prototype.putInt = function (e, t) {
              f(t);
              var r = "";
              do (t -= 8), (r += String.fromCharCode((e >> t) & 255));
              while (t > 0);
              return this.putBytes(r);
            }),
            (p.ByteStringBuffer.prototype.putSignedInt = function (e, t) {
              return e < 0 && (e += 2 << (t - 1)), this.putInt(e, t);
            }),
            (p.ByteStringBuffer.prototype.putBuffer = function (e) {
              return this.putBytes(e.getBytes());
            }),
            (p.ByteStringBuffer.prototype.getByte = function () {
              return this.data.charCodeAt(this.read++);
            }),
            (p.ByteStringBuffer.prototype.getInt16 = function () {
              var e =
                (this.data.charCodeAt(this.read) << 8) ^
                this.data.charCodeAt(this.read + 1);
              return (this.read += 2), e;
            }),
            (p.ByteStringBuffer.prototype.getInt24 = function () {
              var e =
                (this.data.charCodeAt(this.read) << 16) ^
                (this.data.charCodeAt(this.read + 1) << 8) ^
                this.data.charCodeAt(this.read + 2);
              return (this.read += 3), e;
            }),
            (p.ByteStringBuffer.prototype.getInt32 = function () {
              var e =
                (this.data.charCodeAt(this.read) << 24) ^
                (this.data.charCodeAt(this.read + 1) << 16) ^
                (this.data.charCodeAt(this.read + 2) << 8) ^
                this.data.charCodeAt(this.read + 3);
              return (this.read += 4), e;
            }),
            (p.ByteStringBuffer.prototype.getInt16Le = function () {
              var e =
                this.data.charCodeAt(this.read) ^
                (this.data.charCodeAt(this.read + 1) << 8);
              return (this.read += 2), e;
            }),
            (p.ByteStringBuffer.prototype.getInt24Le = function () {
              var e =
                this.data.charCodeAt(this.read) ^
                (this.data.charCodeAt(this.read + 1) << 8) ^
                (this.data.charCodeAt(this.read + 2) << 16);
              return (this.read += 3), e;
            }),
            (p.ByteStringBuffer.prototype.getInt32Le = function () {
              var e =
                this.data.charCodeAt(this.read) ^
                (this.data.charCodeAt(this.read + 1) << 8) ^
                (this.data.charCodeAt(this.read + 2) << 16) ^
                (this.data.charCodeAt(this.read + 3) << 24);
              return (this.read += 4), e;
            }),
            (p.ByteStringBuffer.prototype.getInt = function (e) {
              f(e);
              var t = 0;
              do (t = (t << 8) + this.data.charCodeAt(this.read++)), (e -= 8);
              while (e > 0);
              return t;
            }),
            (p.ByteStringBuffer.prototype.getSignedInt = function (e) {
              var t = this.getInt(e),
                r = 2 << (e - 2);
              return t >= r && (t -= r << 1), t;
            }),
            (p.ByteStringBuffer.prototype.getBytes = function (e) {
              var t;
              return (
                e
                  ? ((e = Math.min(this.length(), e)),
                    (t = this.data.slice(this.read, this.read + e)),
                    (this.read += e))
                  : 0 === e
                  ? (t = "")
                  : ((t =
                      0 === this.read ? this.data : this.data.slice(this.read)),
                    this.clear()),
                t
              );
            }),
            (p.ByteStringBuffer.prototype.bytes = function (e) {
              return void 0 === e
                ? this.data.slice(this.read)
                : this.data.slice(this.read, this.read + e);
            }),
            (p.ByteStringBuffer.prototype.at = function (e) {
              return this.data.charCodeAt(this.read + e);
            }),
            (p.ByteStringBuffer.prototype.setAt = function (e, t) {
              return (
                (this.data =
                  this.data.substr(0, this.read + e) +
                  String.fromCharCode(t) +
                  this.data.substr(this.read + e + 1)),
                this
              );
            }),
            (p.ByteStringBuffer.prototype.last = function () {
              return this.data.charCodeAt(this.data.length - 1);
            }),
            (p.ByteStringBuffer.prototype.copy = function () {
              var e = p.createBuffer(this.data);
              return (e.read = this.read), e;
            }),
            (p.ByteStringBuffer.prototype.compact = function () {
              return (
                this.read > 0 &&
                  ((this.data = this.data.slice(this.read)), (this.read = 0)),
                this
              );
            }),
            (p.ByteStringBuffer.prototype.clear = function () {
              return (this.data = ""), (this.read = 0), this;
            }),
            (p.ByteStringBuffer.prototype.truncate = function (e) {
              var t = Math.max(0, this.length() - e);
              return (
                (this.data = this.data.substr(this.read, t)),
                (this.read = 0),
                this
              );
            }),
            (p.ByteStringBuffer.prototype.toHex = function () {
              for (var e = "", t = this.read; t < this.data.length; ++t) {
                var r = this.data.charCodeAt(t);
                r < 16 && (e += "0"), (e += r.toString(16));
              }
              return e;
            }),
            (p.ByteStringBuffer.prototype.toString = function () {
              return p.decodeUtf8(this.bytes());
            }),
            (p.DataBuffer = function (e, t) {
              (t = t || {}),
                (this.read = t.readOffset || 0),
                (this.growSize = t.growSize || 1024);
              var r = p.isArrayBuffer(e),
                n = p.isArrayBufferView(e);
              if (r || n)
                return (
                  (this.data = r
                    ? new DataView(e)
                    : new DataView(e.buffer, e.byteOffset, e.byteLength)),
                  void (this.write =
                    "writeOffset" in t ? t.writeOffset : this.data.byteLength)
                );
              (this.data = new DataView(new ArrayBuffer(0))),
                (this.write = 0),
                null != e && this.putBytes(e),
                "writeOffset" in t && (this.write = t.writeOffset);
            }),
            (p.DataBuffer.prototype.length = function () {
              return this.write - this.read;
            }),
            (p.DataBuffer.prototype.isEmpty = function () {
              return 0 >= this.length();
            }),
            (p.DataBuffer.prototype.accommodate = function (e, t) {
              if (this.length() >= e) return this;
              t = Math.max(t || this.growSize, e);
              var r = new Uint8Array(
                  this.data.buffer,
                  this.data.byteOffset,
                  this.data.byteLength
                ),
                n = new Uint8Array(this.length() + t);
              return n.set(r), (this.data = new DataView(n.buffer)), this;
            }),
            (p.DataBuffer.prototype.putByte = function (e) {
              return (
                this.accommodate(1), this.data.setUint8(this.write++, e), this
              );
            }),
            (p.DataBuffer.prototype.fillWithByte = function (e, t) {
              this.accommodate(t);
              for (var r = 0; r < t; ++r) this.data.setUint8(e);
              return this;
            }),
            (p.DataBuffer.prototype.putBytes = function (e, t) {
              if (p.isArrayBufferView(e)) {
                var r,
                  n =
                    (i = new Uint8Array(e.buffer, e.byteOffset, e.byteLength))
                      .byteLength - i.byteOffset;
                return (
                  this.accommodate(n),
                  new Uint8Array(this.data.buffer, this.write).set(i),
                  (this.write += n),
                  this
                );
              }
              if (p.isArrayBuffer(e)) {
                var i = new Uint8Array(e);
                return (
                  this.accommodate(i.byteLength),
                  new Uint8Array(this.data.buffer).set(i, this.write),
                  (this.write += i.byteLength),
                  this
                );
              }
              if (
                e instanceof p.DataBuffer ||
                ("object" == typeof e &&
                  "number" == typeof e.read &&
                  "number" == typeof e.write &&
                  p.isArrayBufferView(e.data))
              )
                return (
                  (i = new Uint8Array(e.data.byteLength, e.read, e.length())),
                  this.accommodate(i.byteLength),
                  new Uint8Array(e.data.byteLength, this.write).set(i),
                  (this.write += i.byteLength),
                  this
                );
              if (
                (e instanceof p.ByteStringBuffer &&
                  ((e = e.data), (t = "binary")),
                (t = t || "binary"),
                "string" == typeof e)
              ) {
                if ("hex" === t)
                  return (
                    this.accommodate(Math.ceil(e.length / 2)),
                    (r = new Uint8Array(this.data.buffer, this.write)),
                    (this.write += p.binary.hex.decode(e, r, this.write)),
                    this
                  );
                if ("base64" === t)
                  return (
                    this.accommodate(3 * Math.ceil(e.length / 4)),
                    (r = new Uint8Array(this.data.buffer, this.write)),
                    (this.write += p.binary.base64.decode(e, r, this.write)),
                    this
                  );
                if (
                  ("utf8" === t && ((e = p.encodeUtf8(e)), (t = "binary")),
                  "binary" === t || "raw" === t)
                )
                  return (
                    this.accommodate(e.length),
                    (r = new Uint8Array(this.data.buffer, this.write)),
                    (this.write += p.binary.raw.decode(r)),
                    this
                  );
                if ("utf16" === t)
                  return (
                    this.accommodate(2 * e.length),
                    (r = new Uint16Array(this.data.buffer, this.write)),
                    (this.write += p.text.utf16.encode(r)),
                    this
                  );
                throw Error("Invalid encoding: " + t);
              }
              throw Error("Invalid parameter: " + e);
            }),
            (p.DataBuffer.prototype.putBuffer = function (e) {
              return this.putBytes(e), e.clear(), this;
            }),
            (p.DataBuffer.prototype.putString = function (e) {
              return this.putBytes(e, "utf16");
            }),
            (p.DataBuffer.prototype.putInt16 = function (e) {
              return (
                this.accommodate(2),
                this.data.setInt16(this.write, e),
                (this.write += 2),
                this
              );
            }),
            (p.DataBuffer.prototype.putInt24 = function (e) {
              return (
                this.accommodate(3),
                this.data.setInt16(this.write, (e >> 8) & 65535),
                this.data.setInt8(this.write, (e >> 16) & 255),
                (this.write += 3),
                this
              );
            }),
            (p.DataBuffer.prototype.putInt32 = function (e) {
              return (
                this.accommodate(4),
                this.data.setInt32(this.write, e),
                (this.write += 4),
                this
              );
            }),
            (p.DataBuffer.prototype.putInt16Le = function (e) {
              return (
                this.accommodate(2),
                this.data.setInt16(this.write, e, !0),
                (this.write += 2),
                this
              );
            }),
            (p.DataBuffer.prototype.putInt24Le = function (e) {
              return (
                this.accommodate(3),
                this.data.setInt8(this.write, (e >> 16) & 255),
                this.data.setInt16(this.write, (e >> 8) & 65535, !0),
                (this.write += 3),
                this
              );
            }),
            (p.DataBuffer.prototype.putInt32Le = function (e) {
              return (
                this.accommodate(4),
                this.data.setInt32(this.write, e, !0),
                (this.write += 4),
                this
              );
            }),
            (p.DataBuffer.prototype.putInt = function (e, t) {
              f(t), this.accommodate(t / 8);
              do (t -= 8), this.data.setInt8(this.write++, (e >> t) & 255);
              while (t > 0);
              return this;
            }),
            (p.DataBuffer.prototype.putSignedInt = function (e, t) {
              return (
                f(t),
                this.accommodate(t / 8),
                e < 0 && (e += 2 << (t - 1)),
                this.putInt(e, t)
              );
            }),
            (p.DataBuffer.prototype.getByte = function () {
              return this.data.getInt8(this.read++);
            }),
            (p.DataBuffer.prototype.getInt16 = function () {
              var e = this.data.getInt16(this.read);
              return (this.read += 2), e;
            }),
            (p.DataBuffer.prototype.getInt24 = function () {
              var e =
                (this.data.getInt16(this.read) << 8) ^
                this.data.getInt8(this.read + 2);
              return (this.read += 3), e;
            }),
            (p.DataBuffer.prototype.getInt32 = function () {
              var e = this.data.getInt32(this.read);
              return (this.read += 4), e;
            }),
            (p.DataBuffer.prototype.getInt16Le = function () {
              var e = this.data.getInt16(this.read, !0);
              return (this.read += 2), e;
            }),
            (p.DataBuffer.prototype.getInt24Le = function () {
              var e =
                this.data.getInt8(this.read) ^
                (this.data.getInt16(this.read + 1, !0) << 8);
              return (this.read += 3), e;
            }),
            (p.DataBuffer.prototype.getInt32Le = function () {
              var e = this.data.getInt32(this.read, !0);
              return (this.read += 4), e;
            }),
            (p.DataBuffer.prototype.getInt = function (e) {
              f(e);
              var t = 0;
              do (t = (t << 8) + this.data.getInt8(this.read++)), (e -= 8);
              while (e > 0);
              return t;
            }),
            (p.DataBuffer.prototype.getSignedInt = function (e) {
              var t = this.getInt(e),
                r = 2 << (e - 2);
              return t >= r && (t -= r << 1), t;
            }),
            (p.DataBuffer.prototype.getBytes = function (e) {
              var t;
              return (
                e
                  ? ((e = Math.min(this.length(), e)),
                    (t = this.data.slice(this.read, this.read + e)),
                    (this.read += e))
                  : 0 === e
                  ? (t = "")
                  : ((t =
                      0 === this.read ? this.data : this.data.slice(this.read)),
                    this.clear()),
                t
              );
            }),
            (p.DataBuffer.prototype.bytes = function (e) {
              return void 0 === e
                ? this.data.slice(this.read)
                : this.data.slice(this.read, this.read + e);
            }),
            (p.DataBuffer.prototype.at = function (e) {
              return this.data.getUint8(this.read + e);
            }),
            (p.DataBuffer.prototype.setAt = function (e, t) {
              return this.data.setUint8(e, t), this;
            }),
            (p.DataBuffer.prototype.last = function () {
              return this.data.getUint8(this.write - 1);
            }),
            (p.DataBuffer.prototype.copy = function () {
              return new p.DataBuffer(this);
            }),
            (p.DataBuffer.prototype.compact = function () {
              if (this.read > 0) {
                var e = new Uint8Array(this.data.buffer, this.read),
                  t = new Uint8Array(e.byteLength);
                t.set(e),
                  (this.data = new DataView(t)),
                  (this.write -= this.read),
                  (this.read = 0);
              }
              return this;
            }),
            (p.DataBuffer.prototype.clear = function () {
              return (
                (this.data = new DataView(new ArrayBuffer(0))),
                (this.read = this.write = 0),
                this
              );
            }),
            (p.DataBuffer.prototype.truncate = function (e) {
              return (
                (this.write = Math.max(0, this.length() - e)),
                (this.read = Math.min(this.read, this.write)),
                this
              );
            }),
            (p.DataBuffer.prototype.toHex = function () {
              for (var e = "", t = this.read; t < this.data.byteLength; ++t) {
                var r = this.data.getUint8(t);
                r < 16 && (e += "0"), (e += r.toString(16));
              }
              return e;
            }),
            (p.DataBuffer.prototype.toString = function (e) {
              var t = new Uint8Array(this.data, this.read, this.length());
              if ("binary" === (e = e || "utf8") || "raw" === e)
                return p.binary.raw.encode(t);
              if ("hex" === e) return p.binary.hex.encode(t);
              if ("base64" === e) return p.binary.base64.encode(t);
              if ("utf8" === e) return p.text.utf8.decode(t);
              if ("utf16" === e) return p.text.utf16.decode(t);
              throw Error("Invalid encoding: " + e);
            }),
            (p.createBuffer = function (e, t) {
              return (
                (t = t || "raw"),
                void 0 !== e && "utf8" === t && (e = p.encodeUtf8(e)),
                new p.ByteBuffer(e)
              );
            }),
            (p.fillString = function (e, t) {
              for (var r = ""; t > 0; )
                1 & t && (r += e), (t >>>= 1) > 0 && (e += e);
              return r;
            }),
            (p.xorBytes = function (e, t, r) {
              for (var n = "", i = "", a = "", s = 0, o = 0; r > 0; --r, ++s)
                (i = e.charCodeAt(s) ^ t.charCodeAt(s)),
                  o >= 10 && ((n += a), (a = ""), (o = 0)),
                  (a += String.fromCharCode(i)),
                  ++o;
              return n + a;
            }),
            (p.hexToBytes = function (e) {
              var t = "",
                r = 0;
              for (
                !0 & e.length &&
                ((r = 1), (t += String.fromCharCode(parseInt(e[0], 16))));
                r < e.length;
                r += 2
              )
                t += String.fromCharCode(parseInt(e.substr(r, 2), 16));
              return t;
            }),
            (p.bytesToHex = function (e) {
              return p.createBuffer(e).toHex();
            }),
            (p.int32ToBytes = function (e) {
              return (
                String.fromCharCode((e >> 24) & 255) +
                String.fromCharCode((e >> 16) & 255) +
                String.fromCharCode((e >> 8) & 255) +
                String.fromCharCode(255 & e)
              );
            });
          var d =
              "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
            $ = [
              62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1,
              -1, -1, 64, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
              13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1,
              -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
              39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
            ],
            g = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
          (p.encode64 = function (e, t) {
            for (var r, n, i, a = "", s = "", o = 0; o < e.length; )
              (r = e.charCodeAt(o++)),
                (n = e.charCodeAt(o++)),
                (i = e.charCodeAt(o++)),
                (a += d.charAt(r >> 2)),
                (a += d.charAt(((3 & r) << 4) | (n >> 4))),
                isNaN(n)
                  ? (a += "==")
                  : ((a += d.charAt(((15 & n) << 2) | (i >> 6))),
                    (a += isNaN(i) ? "=" : d.charAt(63 & i))),
                t &&
                  a.length > t &&
                  ((s += a.substr(0, t) + "\r\n"), (a = a.substr(t)));
            return s + a;
          }),
            (p.decode64 = function (e) {
              e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
              for (var t, r, n, i, a = "", s = 0; s < e.length; )
                (t = $[e.charCodeAt(s++) - 43]),
                  (r = $[e.charCodeAt(s++) - 43]),
                  (n = $[e.charCodeAt(s++) - 43]),
                  (i = $[e.charCodeAt(s++) - 43]),
                  (a += String.fromCharCode((t << 2) | (r >> 4))),
                  64 !== n &&
                    ((a += String.fromCharCode(((15 & r) << 4) | (n >> 2))),
                    64 !== i && (a += String.fromCharCode(((3 & n) << 6) | i)));
              return a;
            }),
            (p.encodeUtf8 = function (e) {
              return unescape(encodeURIComponent(e));
            }),
            (p.decodeUtf8 = function (e) {
              return decodeURIComponent(escape(e));
            }),
            (p.binary = {
              raw: {},
              hex: {},
              base64: {},
              base58: {},
              baseN: { encode: _.encode, decode: _.decode },
            }),
            (p.binary.raw.encode = function (e) {
              return String.fromCharCode.apply(null, e);
            }),
            (p.binary.raw.decode = function (e, t, r) {
              var n = t;
              n || (n = new Uint8Array(e.length));
              for (var i = (r = r || 0), a = 0; a < e.length; ++a)
                n[i++] = e.charCodeAt(a);
              return t ? i - r : n;
            }),
            (p.binary.hex.encode = p.bytesToHex),
            (p.binary.hex.decode = function (e, t, r) {
              var n = t;
              n || (n = new Uint8Array(Math.ceil(e.length / 2)));
              var i = 0,
                a = (r = r || 0);
              for (
                1 & e.length && ((i = 1), (n[a++] = parseInt(e[0], 16)));
                i < e.length;
                i += 2
              )
                n[a++] = parseInt(e.substr(i, 2), 16);
              return t ? a - r : n;
            }),
            (p.binary.base64.encode = function (e, t) {
              for (var r, n, i, a = "", s = "", o = 0; o < e.byteLength; )
                (r = e[o++]),
                  (n = e[o++]),
                  (i = e[o++]),
                  (a += d.charAt(r >> 2)),
                  (a += d.charAt(((3 & r) << 4) | (n >> 4))),
                  isNaN(n)
                    ? (a += "==")
                    : ((a += d.charAt(((15 & n) << 2) | (i >> 6))),
                      (a += isNaN(i) ? "=" : d.charAt(63 & i))),
                  t &&
                    a.length > t &&
                    ((s += a.substr(0, t) + "\r\n"), (a = a.substr(t)));
              return s + a;
            }),
            (p.binary.base64.decode = function (e, t, r) {
              var n,
                i,
                a,
                s,
                o = t;
              o || (o = new Uint8Array(3 * Math.ceil(e.length / 4))),
                (e = e.replace(/[^A-Za-z0-9\+\/\=]/g, ""));
              for (var c = 0, u = (r = r || 0); c < e.length; )
                (n = $[e.charCodeAt(c++) - 43]),
                  (i = $[e.charCodeAt(c++) - 43]),
                  (a = $[e.charCodeAt(c++) - 43]),
                  (s = $[e.charCodeAt(c++) - 43]),
                  (o[u++] = (n << 2) | (i >> 4)),
                  64 !== a &&
                    ((o[u++] = ((15 & i) << 4) | (a >> 2)),
                    64 !== s && (o[u++] = ((3 & a) << 6) | s));
              return t ? u - r : o.subarray(0, u);
            }),
            (p.binary.base58.encode = function (e, t) {
              return p.binary.baseN.encode(e, g, t);
            }),
            (p.binary.base58.decode = function (e, t) {
              return p.binary.baseN.decode(e, g, t);
            }),
            (p.text = { utf8: {}, utf16: {} }),
            (p.text.utf8.encode = function (e, t, r) {
              e = p.encodeUtf8(e);
              var n = t;
              n || (n = new Uint8Array(e.length));
              for (var i = (r = r || 0), a = 0; a < e.length; ++a)
                n[i++] = e.charCodeAt(a);
              return t ? i - r : n;
            }),
            (p.text.utf8.decode = function (e) {
              return p.decodeUtf8(String.fromCharCode.apply(null, e));
            }),
            (p.text.utf16.encode = function (e, t, r) {
              var n = t;
              n || (n = new Uint8Array(2 * e.length));
              for (
                var i = new Uint16Array(n.buffer),
                  a = (r = r || 0),
                  s = r,
                  o = 0;
                o < e.length;
                ++o
              )
                (i[s++] = e.charCodeAt(o)), (a += 2);
              return t ? a - r : n;
            }),
            (p.text.utf16.decode = function (e) {
              return String.fromCharCode.apply(null, new Uint16Array(e.buffer));
            }),
            (p.deflate = function (e, t, r) {
              if (((t = p.decode64(e.deflate(p.encode64(t)).rval)), r)) {
                var n = 2;
                32 & t.charCodeAt(1) && (n = 6),
                  (t = t.substring(n, t.length - 4));
              }
              return t;
            }),
            (p.inflate = function (e, t, r) {
              var n = e.inflate(p.encode64(t)).rval;
              return null === n ? null : p.decode64(n);
            });
          var y = function (e, t, r) {
              if (!e) throw Error("WebStorage not available.");
              if (
                (null === r
                  ? (n = e.removeItem(t))
                  : ((r = p.encode64(JSON.stringify(r))),
                    (n = e.setItem(t, r))),
                void 0 !== n && !0 !== n.rval)
              ) {
                var n,
                  i = Error(n.error.message);
                throw ((i.id = n.error.id), (i.name = n.error.name), i);
              }
            },
            m = function (e, t) {
              if (!e) throw Error("WebStorage not available.");
              var r = e.getItem(t);
              if (e.init) {
                if (null === r.rval) {
                  if (r.error) {
                    var n = Error(r.error.message);
                    throw ((n.id = r.error.id), (n.name = r.error.name), n);
                  }
                  r = null;
                } else r = r.rval;
              }
              return null !== r && (r = JSON.parse(p.decode64(r))), r;
            },
            v = function (e, t, r, n) {
              var i = m(e, t);
              null === i && (i = {}), (i[r] = n), y(e, t, i);
            },
            C = function (e, t, r) {
              var n = m(e, t);
              return null !== n && (n = r in n ? n[r] : null), n;
            },
            E = function (e, t, r) {
              var n = m(e, t);
              if (null !== n && r in n) {
                delete n[r];
                var i = !0;
                for (var a in n) {
                  i = !1;
                  break;
                }
                i && (n = null), y(e, t, n);
              }
            },
            S = function (e, t) {
              y(e, t, null);
            },
            b = function (e, t, r) {
              var n,
                i = null;
              void 0 === r && (r = ["web", "flash"]);
              var a = !1,
                s = null;
              for (var o in r) {
                n = r[o];
                try {
                  if ("flash" === n || "both" === n) {
                    if (null === t[0])
                      throw Error("Flash local storage not available.");
                    (i = e.apply(this, t)), (a = "flash" === n);
                  }
                  ("web" !== n && "both" !== n) ||
                    ((t[0] = localStorage), (i = e.apply(this, t)), (a = !0));
                } catch (c) {
                  s = c;
                }
                if (a) break;
              }
              if (!a) throw s;
              return i;
            };
          (p.setItem = function (e, t, r, n, i) {
            b(v, arguments, i);
          }),
            (p.getItem = function (e, t, r, n) {
              return b(C, arguments, n);
            }),
            (p.removeItem = function (e, t, r, n) {
              b(E, arguments, n);
            }),
            (p.clearItems = function (e, t, r) {
              b(S, arguments, r);
            }),
            (p.parseUrl = function (e) {
              var t = /^(https?):\/\/([^:&^\/]*):?(\d*)(.*)$/g;
              t.lastIndex = 0;
              var r = t.exec(e),
                n =
                  null === r
                    ? null
                    : {
                        full: e,
                        scheme: r[1],
                        host: r[2],
                        port: r[3],
                        path: r[4],
                      };
              return (
                n &&
                  ((n.fullHost = n.host),
                  n.port
                    ? 80 !== n.port && "http" === n.scheme
                      ? (n.fullHost += ":" + n.port)
                      : 443 !== n.port &&
                        "https" === n.scheme &&
                        (n.fullHost += ":" + n.port)
                    : "http" === n.scheme
                    ? (n.port = 80)
                    : "https" === n.scheme && (n.port = 443),
                  (n.full = n.scheme + "://" + n.fullHost)),
                n
              );
            });
          var T = null;
          (p.getQueryVariables = function (e) {
            var t,
              r = function (e) {
                for (var t = {}, r = e.split("&"), n = 0; n < r.length; n++) {
                  var i,
                    a,
                    s = r[n].indexOf("=");
                  s > 0
                    ? ((i = r[n].substring(0, s)), (a = r[n].substring(s + 1)))
                    : ((i = r[n]), (a = null)),
                    i in t || (t[i] = []),
                    i in Object.prototype ||
                      null === a ||
                      t[i].push(unescape(a));
                }
                return t;
              };
            return (
              void 0 === e
                ? (null === T &&
                    (T =
                      "undefined" != typeof window &&
                      window.location &&
                      window.location.search
                        ? r(window.location.search.substring(1))
                        : {}),
                  (t = T))
                : (t = r(e)),
              t
            );
          }),
            (p.parseFragment = function (e) {
              var t = e,
                r = "",
                n = e.indexOf("?");
              n > 0 && ((t = e.substring(0, n)), (r = e.substring(n + 1)));
              var i = t.split("/");
              return (
                i.length > 0 && "" === i[0] && i.shift(),
                {
                  pathString: t,
                  queryString: r,
                  path: i,
                  query: "" === r ? {} : p.getQueryVariables(r),
                }
              );
            }),
            (p.makeRequest = function (e) {
              var t = p.parseFragment(e),
                r = {
                  path: t.pathString,
                  query: t.queryString,
                  getPath: function (e) {
                    return void 0 === e ? t.path : t.path[e];
                  },
                  getQuery: function (e, r) {
                    var n;
                    return (
                      void 0 === e
                        ? (n = t.query)
                        : (n = t.query[e]) && void 0 !== r && (n = n[r]),
                      n
                    );
                  },
                  getQueryLast: function (e, t) {
                    var n = r.getQuery(e);
                    return n ? n[n.length - 1] : t;
                  },
                };
              return r;
            }),
            (p.makeLink = function (e, t, r) {
              e = jQuery.isArray(e) ? e.join("/") : e;
              var n = jQuery.param(t || {});
              return (
                (r = r || ""),
                e +
                  (n.length > 0 ? "?" + n : "") +
                  (r.length > 0 ? "#" + r : "")
              );
            }),
            (p.setPath = function (e, t, r) {
              if ("object" == typeof e && null !== e)
                for (var n = 0, i = t.length; n < i; ) {
                  var a = t[n++];
                  if (n == i) e[a] = r;
                  else {
                    var s = a in e;
                    (!s ||
                      (s && "object" != typeof e[a]) ||
                      (s && null === e[a])) &&
                      (e[a] = {}),
                      (e = e[a]);
                  }
                }
            }),
            (p.getPath = function (e, t, r) {
              for (
                var n = 0, i = t.length, a = !0;
                a && n < i && "object" == typeof e && null !== e;

              ) {
                var s = t[n++];
                (a = s in e) && (e = e[s]);
              }
              return a ? e : r;
            }),
            (p.deletePath = function (e, t) {
              if ("object" == typeof e && null !== e)
                for (var r = 0, n = t.length; r < n; ) {
                  var i = t[r++];
                  if (r == n) delete e[i];
                  else {
                    if (!(i in e) || "object" != typeof e[i] || null === e[i])
                      break;
                    e = e[i];
                  }
                }
            }),
            (p.isEmpty = function (e) {
              for (var t in e) if (e.hasOwnProperty(t)) return !1;
              return !0;
            }),
            (p.format = function (e) {
              for (
                var t, r, n = /%./g, i = 0, a = [], s = 0;
                (t = n.exec(e));

              ) {
                (r = e.substring(s, n.lastIndex - 2)).length > 0 && a.push(r),
                  (s = n.lastIndex);
                var o = t[0][1];
                switch (o) {
                  case "s":
                  case "o":
                    i < arguments.length
                      ? a.push(arguments[1 + i++])
                      : a.push("<?>");
                    break;
                  case "%":
                    a.push("%");
                    break;
                  default:
                    a.push("<%" + o + "?>");
                }
              }
              return a.push(e.substring(s)), a.join("");
            }),
            (p.formatNumber = function (e, t, r, n) {
              var i = e,
                a = isNaN((t = Math.abs(t))) ? 2 : t,
                s = void 0 === n ? "." : n,
                o = i < 0 ? "-" : "",
                c = parseInt((i = Math.abs(+i || 0).toFixed(a)), 10) + "",
                u = c.length > 3 ? c.length % 3 : 0;
              return (
                o +
                (u ? c.substr(0, u) + s : "") +
                c.substr(u).replace(/(\d{3})(?=\d)/g, "$1" + s) +
                (a
                  ? (void 0 === r ? "," : r) +
                    Math.abs(i - c)
                      .toFixed(a)
                      .slice(2)
                  : "")
              );
            }),
            (p.formatSize = function (e) {
              return (e =
                e >= 1073741824
                  ? p.formatNumber(e / 1073741824, 2, ".", "") + " GiB"
                  : e >= 1048576
                  ? p.formatNumber(e / 1048576, 2, ".", "") + " MiB"
                  : e >= 1024
                  ? p.formatNumber(e / 1024, 0) + " KiB"
                  : p.formatNumber(e, 0) + " bytes");
            }),
            (p.bytesFromIP = function (e) {
              return -1 !== e.indexOf(".")
                ? p.bytesFromIPv4(e)
                : -1 !== e.indexOf(":")
                ? p.bytesFromIPv6(e)
                : null;
            }),
            (p.bytesFromIPv4 = function (e) {
              if (4 !== (e = e.split(".")).length) return null;
              for (var t = p.createBuffer(), r = 0; r < e.length; ++r) {
                var n = parseInt(e[r], 10);
                if (isNaN(n)) return null;
                t.putByte(n);
              }
              return t.getBytes();
            }),
            (p.bytesFromIPv6 = function (e) {
              for (
                var t = 0,
                  r =
                    2 *
                    (8 -
                      (e = e.split(":").filter(function (e) {
                        return 0 === e.length && ++t, !0;
                      })).length +
                      t),
                  n = p.createBuffer(),
                  i = 0;
                i < 8;
                ++i
              )
                if (e[i] && 0 !== e[i].length) {
                  var a = p.hexToBytes(e[i]);
                  a.length < 2 && n.putByte(0), n.putBytes(a);
                } else n.fillWithByte(0, r), (r = 0);
              return n.getBytes();
            }),
            (p.bytesToIP = function (e) {
              return 4 === e.length
                ? p.bytesToIPv4(e)
                : 16 === e.length
                ? p.bytesToIPv6(e)
                : null;
            }),
            (p.bytesToIPv4 = function (e) {
              if (4 !== e.length) return null;
              for (var t = [], r = 0; r < e.length; ++r)
                t.push(e.charCodeAt(r));
              return t.join(".");
            }),
            (p.bytesToIPv6 = function (e) {
              if (16 !== e.length) return null;
              for (var t = [], r = [], n = 0, i = 0; i < e.length; i += 2) {
                for (
                  var a = p.bytesToHex(e[i] + e[i + 1]);
                  "0" === a[0] && "0" !== a;

                )
                  a = a.substr(1);
                if ("0" === a) {
                  var s = r[r.length - 1],
                    o = t.length;
                  s && o === s.end + 1
                    ? ((s.end = o),
                      s.end - s.start > r[n].end - r[n].start &&
                        (n = r.length - 1))
                    : r.push({ start: o, end: o });
                }
                t.push(a);
              }
              if (r.length > 0) {
                var c = r[n];
                c.end - c.start > 0 &&
                  (t.splice(c.start, c.end - c.start + 1, ""),
                  0 === c.start && t.unshift(""),
                  7 === c.end && t.push(""));
              }
              return t.join(":");
            }),
            (p.estimateCores = function (e, t) {
              if (
                ("function" == typeof e && ((t = e), (e = {})),
                (e = e || {}),
                "cores" in p && !e.update)
              )
                return t(null, p.cores);
              if (
                "undefined" != typeof navigator &&
                "hardwareConcurrency" in navigator &&
                navigator.hardwareConcurrency > 0
              )
                return (
                  (p.cores = navigator.hardwareConcurrency), t(null, p.cores)
                );
              if ("undefined" == typeof Worker)
                return (p.cores = 1), t(null, p.cores);
              if ("undefined" == typeof Blob)
                return (p.cores = 2), t(null, p.cores);
              var r = URL.createObjectURL(
                new Blob(
                  [
                    "(",
                    function () {
                      self.addEventListener("message", function (e) {
                        for (var t = Date.now(), r = t + 4; Date.now() < r; );
                        self.postMessage({ st: t, et: r });
                      });
                    }.toString(),
                    ")()",
                  ],
                  { type: "application/javascript" }
                )
              );
              !(function e(n, i, a) {
                if (0 === i) {
                  var s = Math.floor(
                    n.reduce(function (e, t) {
                      return e + t;
                    }, 0) / n.length
                  );
                  return (
                    (p.cores = Math.max(1, s)),
                    URL.revokeObjectURL(r),
                    t(null, p.cores)
                  );
                }
                !(function (e, t) {
                  for (var n = [], i = [], a = 0; a < e; ++a) {
                    var s = new Worker(r);
                    s.addEventListener("message", function (r) {
                      if ((i.push(r.data), i.length === e)) {
                        for (var a = 0; a < e; ++a) n[a].terminate();
                        t(null, i);
                      }
                    }),
                      n.push(s);
                  }
                  for (var a = 0; a < e; ++a) n[a].postMessage(a);
                })(a, function (t, r) {
                  n.push(
                    (function (e, t) {
                      for (var r = [], n = 0; n < e; ++n)
                        for (var i = t[n], a = (r[n] = []), s = 0; s < e; ++s)
                          if (n !== s) {
                            var o = t[s];
                            ((i.st > o.st && i.st < o.et) ||
                              (o.st > i.st && o.st < i.et)) &&
                              a.push(s);
                          }
                      return r.reduce(function (e, t) {
                        return Math.max(e, t.length);
                      }, 0);
                    })(a, r)
                  ),
                    e(n, i - 1, a);
                });
              })([], 5, 16);
            });
        }).call(
          this,
          e("_process"),
          "undefined" != typeof global
            ? global
            : "undefined" != typeof self
            ? self
            : "undefined" != typeof window
            ? window
            : {},
          e("buffer").Buffer,
          arguments[3],
          arguments[4],
          arguments[5],
          arguments[6],
          e("timers").setImmediate
        );
      },
      { "./baseN": 10, "./forge": 16, _process: 50, buffer: 6, timers: 51 },
    ],
    49: [
      function (e, t, r) {
        var n = e("./forge");
        e("./aes"),
          e("./asn1"),
          e("./des"),
          e("./md"),
          e("./mgf"),
          e("./oids"),
          e("./pem"),
          e("./pss"),
          e("./rsa"),
          e("./util");
        var i = n.asn1,
          a = (t.exports = n.pki = n.pki || {}),
          s = a.oids,
          o = {};
        (o.CN = s.commonName),
          (o.commonName = "CN"),
          (o.C = s.countryName),
          (o.countryName = "C"),
          (o.L = s.localityName),
          (o.localityName = "L"),
          (o.ST = s.stateOrProvinceName),
          (o.stateOrProvinceName = "ST"),
          (o.O = s.organizationName),
          (o.organizationName = "O"),
          (o.OU = s.organizationalUnitName),
          (o.organizationalUnitName = "OU"),
          (o.E = s.emailAddress),
          (o.emailAddress = "E");
        var c = n.pki.rsa.publicKeyValidator,
          u = {
            name: "Certificate",
            tagClass: i.Class.UNIVERSAL,
            type: i.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "Certificate.TBSCertificate",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.SEQUENCE,
                constructed: !0,
                captureAsn1: "tbsCertificate",
                value: [
                  {
                    name: "Certificate.TBSCertificate.version",
                    tagClass: i.Class.CONTEXT_SPECIFIC,
                    type: 0,
                    constructed: !0,
                    optional: !0,
                    value: [
                      {
                        name: "Certificate.TBSCertificate.version.integer",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.INTEGER,
                        constructed: !1,
                        capture: "certVersion",
                      },
                    ],
                  },
                  {
                    name: "Certificate.TBSCertificate.serialNumber",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.INTEGER,
                    constructed: !1,
                    capture: "certSerialNumber",
                  },
                  {
                    name: "Certificate.TBSCertificate.signature",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.SEQUENCE,
                    constructed: !0,
                    value: [
                      {
                        name: "Certificate.TBSCertificate.signature.algorithm",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.OID,
                        constructed: !1,
                        capture: "certinfoSignatureOid",
                      },
                      {
                        name: "Certificate.TBSCertificate.signature.parameters",
                        tagClass: i.Class.UNIVERSAL,
                        optional: !0,
                        captureAsn1: "certinfoSignatureParams",
                      },
                    ],
                  },
                  {
                    name: "Certificate.TBSCertificate.issuer",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.SEQUENCE,
                    constructed: !0,
                    captureAsn1: "certIssuer",
                  },
                  {
                    name: "Certificate.TBSCertificate.validity",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.SEQUENCE,
                    constructed: !0,
                    value: [
                      {
                        name: "Certificate.TBSCertificate.validity.notBefore (utc)",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.UTCTIME,
                        constructed: !1,
                        optional: !0,
                        capture: "certValidity1UTCTime",
                      },
                      {
                        name: "Certificate.TBSCertificate.validity.notBefore (generalized)",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.GENERALIZEDTIME,
                        constructed: !1,
                        optional: !0,
                        capture: "certValidity2GeneralizedTime",
                      },
                      {
                        name: "Certificate.TBSCertificate.validity.notAfter (utc)",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.UTCTIME,
                        constructed: !1,
                        optional: !0,
                        capture: "certValidity3UTCTime",
                      },
                      {
                        name: "Certificate.TBSCertificate.validity.notAfter (generalized)",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.GENERALIZEDTIME,
                        constructed: !1,
                        optional: !0,
                        capture: "certValidity4GeneralizedTime",
                      },
                    ],
                  },
                  {
                    name: "Certificate.TBSCertificate.subject",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.SEQUENCE,
                    constructed: !0,
                    captureAsn1: "certSubject",
                  },
                  c,
                  {
                    name: "Certificate.TBSCertificate.issuerUniqueID",
                    tagClass: i.Class.CONTEXT_SPECIFIC,
                    type: 1,
                    constructed: !0,
                    optional: !0,
                    value: [
                      {
                        name: "Certificate.TBSCertificate.issuerUniqueID.id",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.BITSTRING,
                        constructed: !1,
                        captureBitStringValue: "certIssuerUniqueId",
                      },
                    ],
                  },
                  {
                    name: "Certificate.TBSCertificate.subjectUniqueID",
                    tagClass: i.Class.CONTEXT_SPECIFIC,
                    type: 2,
                    constructed: !0,
                    optional: !0,
                    value: [
                      {
                        name: "Certificate.TBSCertificate.subjectUniqueID.id",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.BITSTRING,
                        constructed: !1,
                        captureBitStringValue: "certSubjectUniqueId",
                      },
                    ],
                  },
                  {
                    name: "Certificate.TBSCertificate.extensions",
                    tagClass: i.Class.CONTEXT_SPECIFIC,
                    type: 3,
                    constructed: !0,
                    captureAsn1: "certExtensions",
                    optional: !0,
                  },
                ],
              },
              {
                name: "Certificate.signatureAlgorithm",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.SEQUENCE,
                constructed: !0,
                value: [
                  {
                    name: "Certificate.signatureAlgorithm.algorithm",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.OID,
                    constructed: !1,
                    capture: "certSignatureOid",
                  },
                  {
                    name: "Certificate.TBSCertificate.signature.parameters",
                    tagClass: i.Class.UNIVERSAL,
                    optional: !0,
                    captureAsn1: "certSignatureParams",
                  },
                ],
              },
              {
                name: "Certificate.signatureValue",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.BITSTRING,
                constructed: !1,
                captureBitStringValue: "certSignature",
              },
            ],
          },
          l = {
            name: "rsapss",
            tagClass: i.Class.UNIVERSAL,
            type: i.Type.SEQUENCE,
            constructed: !0,
            value: [
              {
                name: "rsapss.hashAlgorithm",
                tagClass: i.Class.CONTEXT_SPECIFIC,
                type: 0,
                constructed: !0,
                value: [
                  {
                    name: "rsapss.hashAlgorithm.AlgorithmIdentifier",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Class.SEQUENCE,
                    constructed: !0,
                    optional: !0,
                    value: [
                      {
                        name: "rsapss.hashAlgorithm.AlgorithmIdentifier.algorithm",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.OID,
                        constructed: !1,
                        capture: "hashOid",
                      },
                    ],
                  },
                ],
              },
              {
                name: "rsapss.maskGenAlgorithm",
                tagClass: i.Class.CONTEXT_SPECIFIC,
                type: 1,
                constructed: !0,
                value: [
                  {
                    name: "rsapss.maskGenAlgorithm.AlgorithmIdentifier",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Class.SEQUENCE,
                    constructed: !0,
                    optional: !0,
                    value: [
                      {
                        name: "rsapss.maskGenAlgorithm.AlgorithmIdentifier.algorithm",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.OID,
                        constructed: !1,
                        capture: "maskGenOid",
                      },
                      {
                        name: "rsapss.maskGenAlgorithm.AlgorithmIdentifier.params",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.SEQUENCE,
                        constructed: !0,
                        value: [
                          {
                            name: "rsapss.maskGenAlgorithm.AlgorithmIdentifier.params.algorithm",
                            tagClass: i.Class.UNIVERSAL,
                            type: i.Type.OID,
                            constructed: !1,
                            capture: "maskGenHashOid",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                name: "rsapss.saltLength",
                tagClass: i.Class.CONTEXT_SPECIFIC,
                type: 2,
                optional: !0,
                value: [
                  {
                    name: "rsapss.saltLength.saltLength",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Class.INTEGER,
                    constructed: !1,
                    capture: "saltLength",
                  },
                ],
              },
              {
                name: "rsapss.trailerField",
                tagClass: i.Class.CONTEXT_SPECIFIC,
                type: 3,
                optional: !0,
                value: [
                  {
                    name: "rsapss.trailer.trailer",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Class.INTEGER,
                    constructed: !1,
                    capture: "trailer",
                  },
                ],
              },
            ],
          },
          _ = {
            name: "CertificationRequestInfo",
            tagClass: i.Class.UNIVERSAL,
            type: i.Type.SEQUENCE,
            constructed: !0,
            captureAsn1: "certificationRequestInfo",
            value: [
              {
                name: "CertificationRequestInfo.integer",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.INTEGER,
                constructed: !1,
                capture: "certificationRequestInfoVersion",
              },
              {
                name: "CertificationRequestInfo.subject",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.SEQUENCE,
                constructed: !0,
                captureAsn1: "certificationRequestInfoSubject",
              },
              c,
              {
                name: "CertificationRequestInfo.attributes",
                tagClass: i.Class.CONTEXT_SPECIFIC,
                type: 0,
                constructed: !0,
                optional: !0,
                capture: "certificationRequestInfoAttributes",
                value: [
                  {
                    name: "CertificationRequestInfo.attributes",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.SEQUENCE,
                    constructed: !0,
                    value: [
                      {
                        name: "CertificationRequestInfo.attributes.type",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.OID,
                        constructed: !1,
                      },
                      {
                        name: "CertificationRequestInfo.attributes.value",
                        tagClass: i.Class.UNIVERSAL,
                        type: i.Type.SET,
                        constructed: !0,
                      },
                    ],
                  },
                ],
              },
            ],
          },
          p = {
            name: "CertificationRequest",
            tagClass: i.Class.UNIVERSAL,
            type: i.Type.SEQUENCE,
            constructed: !0,
            captureAsn1: "csr",
            value: [
              _,
              {
                name: "CertificationRequest.signatureAlgorithm",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.SEQUENCE,
                constructed: !0,
                value: [
                  {
                    name: "CertificationRequest.signatureAlgorithm.algorithm",
                    tagClass: i.Class.UNIVERSAL,
                    type: i.Type.OID,
                    constructed: !1,
                    capture: "csrSignatureOid",
                  },
                  {
                    name: "CertificationRequest.signatureAlgorithm.parameters",
                    tagClass: i.Class.UNIVERSAL,
                    optional: !0,
                    captureAsn1: "csrSignatureParams",
                  },
                ],
              },
              {
                name: "CertificationRequest.signature",
                tagClass: i.Class.UNIVERSAL,
                type: i.Type.BITSTRING,
                constructed: !1,
                captureBitStringValue: "csrSignature",
              },
            ],
          };
        function f(e, t) {
          "string" == typeof t && (t = { shortName: t });
          for (
            var r, n = null, i = 0;
            null === n && i < e.attributes.length;
            ++i
          )
            (r = e.attributes[i]),
              t.type && t.type === r.type
                ? (n = r)
                : t.name && t.name === r.name
                ? (n = r)
                : t.shortName && t.shortName === r.shortName && (n = r);
          return n;
        }
        (a.RDNAttributesAsArray = function (e, t) {
          for (var r, n, a, c = [], u = 0; u < e.value.length; ++u) {
            r = e.value[u];
            for (var l = 0; l < r.value.length; ++l)
              (a = {}),
                (n = r.value[l]),
                (a.type = i.derToOid(n.value[0].value)),
                (a.value = n.value[1].value),
                (a.valueTagClass = n.value[1].type),
                a.type in s &&
                  ((a.name = s[a.type]),
                  a.name in o && (a.shortName = o[a.name])),
                t && (t.update(a.type), t.update(a.value)),
                c.push(a);
          }
          return c;
        }),
          (a.CRIAttributesAsArray = function (e) {
            for (var t = [], r = 0; r < e.length; ++r)
              for (
                var n = e[r],
                  c = i.derToOid(n.value[0].value),
                  u = n.value[1].value,
                  l = 0;
                l < u.length;
                ++l
              ) {
                var _ = {};
                if (
                  ((_.type = c),
                  (_.value = u[l].value),
                  (_.valueTagClass = u[l].type),
                  _.type in s &&
                    ((_.name = s[_.type]),
                    _.name in o && (_.shortName = o[_.name])),
                  _.type === s.extensionRequest)
                ) {
                  _.extensions = [];
                  for (var p = 0; p < _.value.length; ++p)
                    _.extensions.push(
                      a.certificateExtensionFromAsn1(_.value[p])
                    );
                }
                t.push(_);
              }
            return t;
          });
        var h = function (e, t, r) {
          var n = {};
          if (e !== s["RSASSA-PSS"]) return n;
          r &&
            (n = {
              hash: { algorithmOid: s.sha1 },
              mgf: { algorithmOid: s.mgf1, hash: { algorithmOid: s.sha1 } },
              saltLength: 20,
            });
          var a = {},
            o = [];
          if (!i.validate(t, l, a, o)) {
            var c = Error("Cannot read RSASSA-PSS parameter block.");
            throw ((c.errors = o), c);
          }
          return (
            void 0 !== a.hashOid &&
              ((n.hash = n.hash || {}),
              (n.hash.algorithmOid = i.derToOid(a.hashOid))),
            void 0 !== a.maskGenOid &&
              ((n.mgf = n.mgf || {}),
              (n.mgf.algorithmOid = i.derToOid(a.maskGenOid)),
              (n.mgf.hash = n.mgf.hash || {}),
              (n.mgf.hash.algorithmOid = i.derToOid(a.maskGenHashOid))),
            void 0 !== a.saltLength &&
              (n.saltLength = a.saltLength.charCodeAt(0)),
            n
          );
        };
        function d(e) {
          for (
            var t,
              r,
              a = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, []),
              s = e.attributes,
              o = 0;
            o < s.length;
            ++o
          ) {
            var c = (t = s[o]).value,
              u = i.Type.PRINTABLESTRING;
            "valueTagClass" in t &&
              (u = t.valueTagClass) === i.Type.UTF8 &&
              (c = n.util.encodeUtf8(c)),
              (r = i.create(i.Class.UNIVERSAL, i.Type.SET, !0, [
                i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                  i.create(
                    i.Class.UNIVERSAL,
                    i.Type.OID,
                    !1,
                    i.oidToDer(t.type).getBytes()
                  ),
                  i.create(i.Class.UNIVERSAL, u, !1, c),
                ]),
              ])),
              a.value.push(r);
          }
          return a;
        }
        function $(e) {
          for (var t, r = 0; r < e.length; ++r) {
            if (
              (void 0 === (t = e[r]).name &&
                (t.type && t.type in a.oids
                  ? (t.name = a.oids[t.type])
                  : t.shortName &&
                    t.shortName in o &&
                    (t.name = a.oids[o[t.shortName]])),
              void 0 === t.type)
            ) {
              if (!(t.name && t.name in a.oids))
                throw (
                  (((n = Error("Attribute type not specified.")).attribute = t),
                  n)
                );
              t.type = a.oids[t.name];
            }
            if (
              (void 0 === t.shortName &&
                t.name &&
                t.name in o &&
                (t.shortName = o[t.name]),
              t.type === s.extensionRequest &&
                ((t.valueConstructed = !0),
                (t.valueTagClass = i.Type.SEQUENCE),
                !t.value && t.extensions))
            ) {
              t.value = [];
              for (var n, c = 0; c < t.extensions.length; ++c)
                t.value.push(a.certificateExtensionToAsn1(g(t.extensions[c])));
            }
            if (void 0 === t.value)
              throw (
                (((n = Error("Attribute value not specified.")).attribute = t),
                n)
              );
          }
        }
        function g(e, t) {
          if (
            ((t = t || {}),
            void 0 === e.name &&
              e.id &&
              e.id in a.oids &&
              (e.name = a.oids[e.id]),
            void 0 === e.id)
          ) {
            if (!(e.name && e.name in a.oids))
              throw (
                (((r = Error("Extension ID not specified.")).extension = e), r)
              );
            e.id = a.oids[e.name];
          }
          if (void 0 !== e.value) return e;
          if ("keyUsage" === e.name) {
            var r,
              o = 0,
              c = 0,
              u = 0;
            e.digitalSignature && ((c |= 128), (o = 7)),
              e.nonRepudiation && ((c |= 64), (o = 6)),
              e.keyEncipherment && ((c |= 32), (o = 5)),
              e.dataEncipherment && ((c |= 16), (o = 4)),
              e.keyAgreement && ((c |= 8), (o = 3)),
              e.keyCertSign && ((c |= 4), (o = 2)),
              e.cRLSign && ((c |= 2), (o = 1)),
              e.encipherOnly && ((c |= 1), (o = 0)),
              e.decipherOnly && ((u |= 128), (o = 7));
            var l = String.fromCharCode(o);
            0 !== u
              ? (l += String.fromCharCode(c) + String.fromCharCode(u))
              : 0 !== c && (l += String.fromCharCode(c)),
              (e.value = i.create(i.Class.UNIVERSAL, i.Type.BITSTRING, !1, l));
          } else if ("basicConstraints" === e.name)
            (e.value = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [])),
              e.cA &&
                e.value.value.push(
                  i.create(i.Class.UNIVERSAL, i.Type.BOOLEAN, !1, "\xff")
                ),
              "pathLenConstraint" in e &&
                e.value.value.push(
                  i.create(
                    i.Class.UNIVERSAL,
                    i.Type.INTEGER,
                    !1,
                    i.integerToDer(e.pathLenConstraint).getBytes()
                  )
                );
          else if ("extKeyUsage" === e.name) {
            e.value = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, []);
            var _ = e.value.value;
            for (var p in e)
              !0 === e[p] &&
                (p in s
                  ? _.push(
                      i.create(
                        i.Class.UNIVERSAL,
                        i.Type.OID,
                        !1,
                        i.oidToDer(s[p]).getBytes()
                      )
                    )
                  : -1 !== p.indexOf(".") &&
                    _.push(
                      i.create(
                        i.Class.UNIVERSAL,
                        i.Type.OID,
                        !1,
                        i.oidToDer(p).getBytes()
                      )
                    ));
          } else if ("nsCertType" === e.name)
            (o = 0),
              (c = 0),
              e.client && ((c |= 128), (o = 7)),
              e.server && ((c |= 64), (o = 6)),
              e.email && ((c |= 32), (o = 5)),
              e.objsign && ((c |= 16), (o = 4)),
              e.reserved && ((c |= 8), (o = 3)),
              e.sslCA && ((c |= 4), (o = 2)),
              e.emailCA && ((c |= 2), (o = 1)),
              e.objCA && ((c |= 1), (o = 0)),
              (l = String.fromCharCode(o)),
              0 !== c && (l += String.fromCharCode(c)),
              (e.value = i.create(i.Class.UNIVERSAL, i.Type.BITSTRING, !1, l));
          else if ("subjectAltName" === e.name || "issuerAltName" === e.name) {
            e.value = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, []);
            for (var f = 0; f < e.altNames.length; ++f) {
              if (((l = (m = e.altNames[f]).value), 7 === m.type && m.ip)) {
                if (null === (l = n.util.bytesFromIP(m.ip)))
                  throw (
                    (((r = Error(
                      'Extension "ip" value is not a valid IPv4 or IPv6 address.'
                    )).extension = e),
                    r)
                  );
              } else
                8 === m.type &&
                  (l = m.oid ? i.oidToDer(i.oidToDer(m.oid)) : i.oidToDer(l));
              e.value.value.push(
                i.create(i.Class.CONTEXT_SPECIFIC, m.type, !1, l)
              );
            }
          } else if ("nsComment" === e.name && t.cert) {
            if (
              !/^[\x00-\x7F]*$/.test(e.comment) ||
              e.comment.length < 1 ||
              e.comment.length > 128
            )
              throw Error('Invalid "nsComment" content.');
            e.value = i.create(
              i.Class.UNIVERSAL,
              i.Type.IA5STRING,
              !1,
              e.comment
            );
          } else if ("subjectKeyIdentifier" === e.name && t.cert) {
            var h = t.cert.generateSubjectKeyIdentifier();
            (e.subjectKeyIdentifier = h.toHex()),
              (e.value = i.create(
                i.Class.UNIVERSAL,
                i.Type.OCTETSTRING,
                !1,
                h.getBytes()
              ));
          } else if ("authorityKeyIdentifier" === e.name && t.cert) {
            if (
              ((e.value = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [])),
              (_ = e.value.value),
              e.keyIdentifier)
            ) {
              var $ =
                !0 === e.keyIdentifier
                  ? t.cert.generateSubjectKeyIdentifier().getBytes()
                  : e.keyIdentifier;
              _.push(i.create(i.Class.CONTEXT_SPECIFIC, 0, !1, $));
            }
            if (e.authorityCertIssuer) {
              var g = [
                i.create(i.Class.CONTEXT_SPECIFIC, 4, !0, [
                  d(
                    !0 === e.authorityCertIssuer
                      ? t.cert.issuer
                      : e.authorityCertIssuer
                  ),
                ]),
              ];
              _.push(i.create(i.Class.CONTEXT_SPECIFIC, 1, !0, g));
            }
            if (e.serialNumber) {
              var y = n.util.hexToBytes(
                !0 === e.serialNumber ? t.cert.serialNumber : e.serialNumber
              );
              _.push(i.create(i.Class.CONTEXT_SPECIFIC, 2, !1, y));
            }
          } else if ("cRLDistributionPoints" === e.name) {
            (e.value = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [])),
              (_ = e.value.value);
            var m,
              v = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, []),
              C = i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, []);
            for (f = 0; f < e.altNames.length; ++f) {
              if (((l = (m = e.altNames[f]).value), 7 === m.type && m.ip)) {
                if (null === (l = n.util.bytesFromIP(m.ip)))
                  throw (
                    (((r = Error(
                      'Extension "ip" value is not a valid IPv4 or IPv6 address.'
                    )).extension = e),
                    r)
                  );
              } else
                8 === m.type &&
                  (l = m.oid ? i.oidToDer(i.oidToDer(m.oid)) : i.oidToDer(l));
              C.value.push(i.create(i.Class.CONTEXT_SPECIFIC, m.type, !1, l));
            }
            v.value.push(i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [C])),
              _.push(v);
          }
          if (void 0 === e.value)
            throw (
              (((r = Error("Extension value not specified.")).extension = e), r)
            );
          return e;
        }
        function y(e, t) {
          if (e === s["RSASSA-PSS"]) {
            var r = [];
            return (
              void 0 !== t.hash.algorithmOid &&
                r.push(
                  i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [
                    i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                      i.create(
                        i.Class.UNIVERSAL,
                        i.Type.OID,
                        !1,
                        i.oidToDer(t.hash.algorithmOid).getBytes()
                      ),
                      i.create(i.Class.UNIVERSAL, i.Type.NULL, !1, ""),
                    ]),
                  ])
                ),
              void 0 !== t.mgf.algorithmOid &&
                r.push(
                  i.create(i.Class.CONTEXT_SPECIFIC, 1, !0, [
                    i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                      i.create(
                        i.Class.UNIVERSAL,
                        i.Type.OID,
                        !1,
                        i.oidToDer(t.mgf.algorithmOid).getBytes()
                      ),
                      i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                        i.create(
                          i.Class.UNIVERSAL,
                          i.Type.OID,
                          !1,
                          i.oidToDer(t.mgf.hash.algorithmOid).getBytes()
                        ),
                        i.create(i.Class.UNIVERSAL, i.Type.NULL, !1, ""),
                      ]),
                    ]),
                  ])
                ),
              void 0 !== t.saltLength &&
                r.push(
                  i.create(i.Class.CONTEXT_SPECIFIC, 2, !0, [
                    i.create(
                      i.Class.UNIVERSAL,
                      i.Type.INTEGER,
                      !1,
                      i.integerToDer(t.saltLength).getBytes()
                    ),
                  ])
                ),
              i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, r)
            );
          }
          return i.create(i.Class.UNIVERSAL, i.Type.NULL, !1, "");
        }
        (a.certificateFromPem = function (e, t, r) {
          var s = n.pem.decode(e)[0];
          if (
            "CERTIFICATE" !== s.type &&
            "X509 CERTIFICATE" !== s.type &&
            "TRUSTED CERTIFICATE" !== s.type
          ) {
            var o = Error(
              'Could not convert certificate from PEM; PEM header type is not "CERTIFICATE", "X509 CERTIFICATE", or "TRUSTED CERTIFICATE".'
            );
            throw ((o.headerType = s.type), o);
          }
          if (s.procType && "ENCRYPTED" === s.procType.type)
            throw Error(
              "Could not convert certificate from PEM; PEM is encrypted."
            );
          var c = i.fromDer(s.body, r);
          return a.certificateFromAsn1(c, t);
        }),
          (a.certificateToPem = function (e, t) {
            var r = {
              type: "CERTIFICATE",
              body: i.toDer(a.certificateToAsn1(e)).getBytes(),
            };
            return n.pem.encode(r, { maxline: t });
          }),
          (a.publicKeyFromPem = function (e) {
            var t = n.pem.decode(e)[0];
            if ("PUBLIC KEY" !== t.type && "RSA PUBLIC KEY" !== t.type) {
              var r = Error(
                'Could not convert public key from PEM; PEM header type is not "PUBLIC KEY" or "RSA PUBLIC KEY".'
              );
              throw ((r.headerType = t.type), r);
            }
            if (t.procType && "ENCRYPTED" === t.procType.type)
              throw Error(
                "Could not convert public key from PEM; PEM is encrypted."
              );
            var s = i.fromDer(t.body);
            return a.publicKeyFromAsn1(s);
          }),
          (a.publicKeyToPem = function (e, t) {
            var r = {
              type: "PUBLIC KEY",
              body: i.toDer(a.publicKeyToAsn1(e)).getBytes(),
            };
            return n.pem.encode(r, { maxline: t });
          }),
          (a.publicKeyToRSAPublicKeyPem = function (e, t) {
            var r = {
              type: "RSA PUBLIC KEY",
              body: i.toDer(a.publicKeyToRSAPublicKey(e)).getBytes(),
            };
            return n.pem.encode(r, { maxline: t });
          }),
          (a.getPublicKeyFingerprint = function (e, t) {
            var r,
              s = (t = t || {}).md || n.md.sha1.create();
            switch (t.type || "RSAPublicKey") {
              case "RSAPublicKey":
                r = i.toDer(a.publicKeyToRSAPublicKey(e)).getBytes();
                break;
              case "SubjectPublicKeyInfo":
                r = i.toDer(a.publicKeyToAsn1(e)).getBytes();
                break;
              default:
                throw Error('Unknown fingerprint type "' + t.type + '".');
            }
            s.start(), s.update(r);
            var o = s.digest();
            if ("hex" === t.encoding) {
              var c = o.toHex();
              return t.delimiter ? c.match(/.{2}/g).join(t.delimiter) : c;
            }
            if ("binary" === t.encoding) return o.getBytes();
            if (t.encoding)
              throw Error('Unknown encoding "' + t.encoding + '".');
            return o;
          }),
          (a.certificationRequestFromPem = function (e, t, r) {
            var s = n.pem.decode(e)[0];
            if ("CERTIFICATE REQUEST" !== s.type) {
              var o = Error(
                'Could not convert certification request from PEM; PEM header type is not "CERTIFICATE REQUEST".'
              );
              throw ((o.headerType = s.type), o);
            }
            if (s.procType && "ENCRYPTED" === s.procType.type)
              throw Error(
                "Could not convert certification request from PEM; PEM is encrypted."
              );
            var c = i.fromDer(s.body, r);
            return a.certificationRequestFromAsn1(c, t);
          }),
          (a.certificationRequestToPem = function (e, t) {
            var r = {
              type: "CERTIFICATE REQUEST",
              body: i.toDer(a.certificationRequestToAsn1(e)).getBytes(),
            };
            return n.pem.encode(r, { maxline: t });
          }),
          (a.createCertificate = function () {
            var e = {
              version: 2,
              serialNumber: "00",
              signatureOid: null,
              signature: null,
              siginfo: {},
            };
            return (
              (e.siginfo.algorithmOid = null),
              (e.validity = {}),
              (e.validity.notBefore = new Date()),
              (e.validity.notAfter = new Date()),
              (e.issuer = {}),
              (e.issuer.getField = function (t) {
                return f(e.issuer, t);
              }),
              (e.issuer.addField = function (t) {
                $([t]), e.issuer.attributes.push(t);
              }),
              (e.issuer.attributes = []),
              (e.issuer.hash = null),
              (e.subject = {}),
              (e.subject.getField = function (t) {
                return f(e.subject, t);
              }),
              (e.subject.addField = function (t) {
                $([t]), e.subject.attributes.push(t);
              }),
              (e.subject.attributes = []),
              (e.subject.hash = null),
              (e.extensions = []),
              (e.publicKey = null),
              (e.md = null),
              (e.setSubject = function (t, r) {
                $(t),
                  (e.subject.attributes = t),
                  delete e.subject.uniqueId,
                  r && (e.subject.uniqueId = r),
                  (e.subject.hash = null);
              }),
              (e.setIssuer = function (t, r) {
                $(t),
                  (e.issuer.attributes = t),
                  delete e.issuer.uniqueId,
                  r && (e.issuer.uniqueId = r),
                  (e.issuer.hash = null);
              }),
              (e.setExtensions = function (t) {
                for (var r = 0; r < t.length; ++r) g(t[r], { cert: e });
                e.extensions = t;
              }),
              (e.getExtension = function (t) {
                "string" == typeof t && (t = { name: t });
                for (
                  var r, n = null, i = 0;
                  null === n && i < e.extensions.length;
                  ++i
                )
                  (r = e.extensions[i]),
                    t.id && r.id === t.id
                      ? (n = r)
                      : t.name && r.name === t.name && (n = r);
                return n;
              }),
              (e.sign = function (t, r) {
                e.md = r || n.md.sha1.create();
                var o = s[e.md.algorithm + "WithRSAEncryption"];
                if (!o) {
                  var c = Error(
                    "Could not compute certificate digest. Unknown message digest algorithm OID."
                  );
                  throw ((c.algorithm = e.md.algorithm), c);
                }
                (e.signatureOid = e.siginfo.algorithmOid = o),
                  (e.tbsCertificate = a.getTBSCertificate(e));
                var u = i.toDer(e.tbsCertificate);
                e.md.update(u.getBytes()), (e.signature = t.sign(e.md));
              }),
              (e.verify = function (t) {
                var r,
                  o,
                  c,
                  u,
                  l = !1;
                if (!e.issued(t)) {
                  var _ = t.issuer,
                    p = e.subject;
                  throw (
                    (((u = Error(
                      "The parent certificate did not issue the given child certificate; the child certificate's issuer does not match the parent's subject."
                    )).expectedIssuer = _.attributes),
                    (u.actualIssuer = p.attributes),
                    u)
                  );
                }
                var f = t.md;
                if (null === f) {
                  if (t.signatureOid in s)
                    switch (s[t.signatureOid]) {
                      case "sha1WithRSAEncryption":
                        f = n.md.sha1.create();
                        break;
                      case "md5WithRSAEncryption":
                        f = n.md.md5.create();
                        break;
                      case "sha256WithRSAEncryption":
                      case "RSASSA-PSS":
                        f = n.md.sha256.create();
                        break;
                      case "sha384WithRSAEncryption":
                        f = n.md.sha384.create();
                        break;
                      case "sha512WithRSAEncryption":
                        f = n.md.sha512.create();
                    }
                  if (null === f)
                    throw (
                      (((u = Error(
                        "Could not compute certificate digest. Unknown signature OID."
                      )).signatureOid = t.signatureOid),
                      u)
                    );
                  var h = t.tbsCertificate || a.getTBSCertificate(t),
                    d = i.toDer(h);
                  f.update(d.getBytes());
                }
                if (null !== f) {
                  switch (t.signatureOid) {
                    case s.sha1WithRSAEncryption:
                      r = void 0;
                      break;
                    case s["RSASSA-PSS"]:
                      if (
                        void 0 ===
                          (o =
                            s[t.signatureParameters.mgf.hash.algorithmOid]) ||
                        void 0 === n.md[o]
                      )
                        throw (
                          (((u = Error("Unsupported MGF hash function.")).oid =
                            t.signatureParameters.mgf.hash.algorithmOid),
                          (u.name = o),
                          u)
                        );
                      if (
                        void 0 ===
                          (c = s[t.signatureParameters.mgf.algorithmOid]) ||
                        void 0 === n.mgf[c]
                      )
                        throw (
                          (((u = Error("Unsupported MGF function.")).oid =
                            t.signatureParameters.mgf.algorithmOid),
                          (u.name = c),
                          u)
                        );
                      if (
                        ((c = n.mgf[c].create(n.md[o].create())),
                        void 0 ===
                          (o = s[t.signatureParameters.hash.algorithmOid]) ||
                          void 0 === n.md[o])
                      )
                        throw {
                          message: "Unsupported RSASSA-PSS hash function.",
                          oid: t.signatureParameters.hash.algorithmOid,
                          name: o,
                        };
                      r = n.pss.create(
                        n.md[o].create(),
                        c,
                        t.signatureParameters.saltLength
                      );
                  }
                  l = e.publicKey.verify(f.digest().getBytes(), t.signature, r);
                }
                return l;
              }),
              (e.isIssuer = function (t) {
                var r,
                  n,
                  i = !1,
                  a = e.issuer,
                  s = t.subject;
                if (a.hash && s.hash) i = a.hash === s.hash;
                else if (a.attributes.length === s.attributes.length) {
                  i = !0;
                  for (var o = 0; i && o < a.attributes.length; ++o)
                    (r = a.attributes[o]),
                      (n = s.attributes[o]),
                      (r.type === n.type && r.value === n.value) || (i = !1);
                }
                return i;
              }),
              (e.issued = function (t) {
                return t.isIssuer(e);
              }),
              (e.generateSubjectKeyIdentifier = function () {
                return a.getPublicKeyFingerprint(e.publicKey, {
                  type: "RSAPublicKey",
                });
              }),
              (e.verifySubjectKeyIdentifier = function () {
                for (
                  var t = s.subjectKeyIdentifier, r = 0;
                  r < e.extensions.length;
                  ++r
                ) {
                  var i = e.extensions[r];
                  if (i.id === t) {
                    var a = e.generateSubjectKeyIdentifier().getBytes();
                    return n.util.hexToBytes(i.subjectKeyIdentifier) === a;
                  }
                }
                return !1;
              }),
              e
            );
          }),
          (a.certificateFromAsn1 = function (e, t) {
            var r = {},
              o = [];
            if (!i.validate(e, u, r, o))
              throw (
                (((p = Error(
                  "Cannot read X.509 certificate. ASN.1 object is not an X509v3 Certificate."
                )).errors = o),
                p)
              );
            if (i.derToOid(r.publicKeyOid) !== a.oids.rsaEncryption)
              throw Error("Cannot read public key. OID is not RSA.");
            var c = a.createCertificate();
            c.version = r.certVersion ? r.certVersion.charCodeAt(0) : 0;
            var l = n.util.createBuffer(r.certSerialNumber);
            (c.serialNumber = l.toHex()),
              (c.signatureOid = n.asn1.derToOid(r.certSignatureOid)),
              (c.signatureParameters = h(
                c.signatureOid,
                r.certSignatureParams,
                !0
              )),
              (c.siginfo.algorithmOid = n.asn1.derToOid(
                r.certinfoSignatureOid
              )),
              (c.siginfo.parameters = h(
                c.siginfo.algorithmOid,
                r.certinfoSignatureParams,
                !1
              )),
              (c.signature = r.certSignature);
            var _ = [];
            if (
              (void 0 !== r.certValidity1UTCTime &&
                _.push(i.utcTimeToDate(r.certValidity1UTCTime)),
              void 0 !== r.certValidity2GeneralizedTime &&
                _.push(i.generalizedTimeToDate(r.certValidity2GeneralizedTime)),
              void 0 !== r.certValidity3UTCTime &&
                _.push(i.utcTimeToDate(r.certValidity3UTCTime)),
              void 0 !== r.certValidity4GeneralizedTime &&
                _.push(i.generalizedTimeToDate(r.certValidity4GeneralizedTime)),
              _.length > 2)
            )
              throw Error(
                "Cannot read notBefore/notAfter validity times; more than two times were provided in the certificate."
              );
            if (_.length < 2)
              throw Error(
                "Cannot read notBefore/notAfter validity times; they were not provided as either UTCTime or GeneralizedTime."
              );
            if (
              ((c.validity.notBefore = _[0]),
              (c.validity.notAfter = _[1]),
              (c.tbsCertificate = r.tbsCertificate),
              t)
            ) {
              if (((c.md = null), c.signatureOid in s))
                switch (s[c.signatureOid]) {
                  case "sha1WithRSAEncryption":
                    c.md = n.md.sha1.create();
                    break;
                  case "md5WithRSAEncryption":
                    c.md = n.md.md5.create();
                    break;
                  case "sha256WithRSAEncryption":
                  case "RSASSA-PSS":
                    c.md = n.md.sha256.create();
                    break;
                  case "sha384WithRSAEncryption":
                    c.md = n.md.sha384.create();
                    break;
                  case "sha512WithRSAEncryption":
                    c.md = n.md.sha512.create();
                }
              if (null === c.md)
                throw (
                  (((p = Error(
                    "Could not compute certificate digest. Unknown signature OID."
                  )).signatureOid = c.signatureOid),
                  p)
                );
              var p,
                d = i.toDer(c.tbsCertificate);
              c.md.update(d.getBytes());
            }
            var g = n.md.sha1.create();
            (c.issuer.getField = function (e) {
              return f(c.issuer, e);
            }),
              (c.issuer.addField = function (e) {
                $([e]), c.issuer.attributes.push(e);
              }),
              (c.issuer.attributes = a.RDNAttributesAsArray(r.certIssuer, g)),
              r.certIssuerUniqueId &&
                (c.issuer.uniqueId = r.certIssuerUniqueId),
              (c.issuer.hash = g.digest().toHex());
            var y = n.md.sha1.create();
            return (
              (c.subject.getField = function (e) {
                return f(c.subject, e);
              }),
              (c.subject.addField = function (e) {
                $([e]), c.subject.attributes.push(e);
              }),
              (c.subject.attributes = a.RDNAttributesAsArray(r.certSubject, y)),
              r.certSubjectUniqueId &&
                (c.subject.uniqueId = r.certSubjectUniqueId),
              (c.subject.hash = y.digest().toHex()),
              r.certExtensions
                ? (c.extensions = a.certificateExtensionsFromAsn1(
                    r.certExtensions
                  ))
                : (c.extensions = []),
              (c.publicKey = a.publicKeyFromAsn1(r.subjectPublicKeyInfo)),
              c
            );
          }),
          (a.certificateExtensionsFromAsn1 = function (e) {
            for (var t = [], r = 0; r < e.value.length; ++r)
              for (var n = e.value[r], i = 0; i < n.value.length; ++i)
                t.push(a.certificateExtensionFromAsn1(n.value[i]));
            return t;
          }),
          (a.certificateExtensionFromAsn1 = function (e) {
            var t,
              r = {};
            if (
              ((r.id = i.derToOid(e.value[0].value)),
              (r.critical = !1),
              e.value[1].type === i.Type.BOOLEAN
                ? ((r.critical = 0 !== e.value[1].value.charCodeAt(0)),
                  (r.value = e.value[2].value))
                : (r.value = e.value[1].value),
              r.id in s)
            ) {
              if (((r.name = s[r.id]), "keyUsage" === r.name)) {
                var a = 0,
                  o = 0;
                (u = i.fromDer(r.value)).value.length > 1 &&
                  ((a = u.value.charCodeAt(1)),
                  (o = u.value.length > 2 ? u.value.charCodeAt(2) : 0)),
                  (r.digitalSignature = 128 == (128 & a)),
                  (r.nonRepudiation = 64 == (64 & a)),
                  (r.keyEncipherment = 32 == (32 & a)),
                  (r.dataEncipherment = 16 == (16 & a)),
                  (r.keyAgreement = 8 == (8 & a)),
                  (r.keyCertSign = 4 == (4 & a)),
                  (r.cRLSign = 2 == (2 & a)),
                  (r.encipherOnly = 1 == (1 & a)),
                  (r.decipherOnly = 128 == (128 & o));
              } else if ("basicConstraints" === r.name) {
                (u = i.fromDer(r.value)).value.length > 0 &&
                u.value[0].type === i.Type.BOOLEAN
                  ? (r.cA = 0 !== u.value[0].value.charCodeAt(0))
                  : (r.cA = !1);
                var c = null;
                u.value.length > 0 && u.value[0].type === i.Type.INTEGER
                  ? (c = u.value[0].value)
                  : u.value.length > 1 && (c = u.value[1].value),
                  null !== c && (r.pathLenConstraint = i.derToInteger(c));
              } else if ("extKeyUsage" === r.name)
                for (
                  var u = i.fromDer(r.value), l = 0;
                  l < u.value.length;
                  ++l
                ) {
                  var _ = i.derToOid(u.value[l].value);
                  _ in s ? (r[s[_]] = !0) : (r[_] = !0);
                }
              else if ("nsCertType" === r.name)
                (a = 0),
                  (u = i.fromDer(r.value)).value.length > 1 &&
                    (a = u.value.charCodeAt(1)),
                  (r.client = 128 == (128 & a)),
                  (r.server = 64 == (64 & a)),
                  (r.email = 32 == (32 & a)),
                  (r.objsign = 16 == (16 & a)),
                  (r.reserved = 8 == (8 & a)),
                  (r.sslCA = 4 == (4 & a)),
                  (r.emailCA = 2 == (2 & a)),
                  (r.objCA = 1 == (1 & a));
              else if (
                "subjectAltName" === r.name ||
                "issuerAltName" === r.name
              ) {
                (r.altNames = []), (u = i.fromDer(r.value));
                for (var p = 0; p < u.value.length; ++p) {
                  var f = { type: (t = u.value[p]).type, value: t.value };
                  switch ((r.altNames.push(f), t.type)) {
                    case 1:
                    case 2:
                    case 6:
                      break;
                    case 7:
                      f.ip = n.util.bytesToIP(t.value);
                      break;
                    case 8:
                      f.oid = i.derToOid(t.value);
                  }
                }
              } else
                "subjectKeyIdentifier" === r.name &&
                  ((u = i.fromDer(r.value)),
                  (r.subjectKeyIdentifier = n.util.bytesToHex(u.value)));
            }
            return r;
          }),
          (a.certificationRequestFromAsn1 = function (e, t) {
            var r = {},
              o = [];
            if (!i.validate(e, p, r, o))
              throw (
                (((u = Error(
                  "Cannot read PKCS#10 certificate request. ASN.1 object is not a PKCS#10 CertificationRequest."
                )).errors = o),
                u)
              );
            if (i.derToOid(r.publicKeyOid) !== a.oids.rsaEncryption)
              throw Error("Cannot read public key. OID is not RSA.");
            var c = a.createCertificationRequest();
            if (
              ((c.version = r.csrVersion ? r.csrVersion.charCodeAt(0) : 0),
              (c.signatureOid = n.asn1.derToOid(r.csrSignatureOid)),
              (c.signatureParameters = h(
                c.signatureOid,
                r.csrSignatureParams,
                !0
              )),
              (c.siginfo.algorithmOid = n.asn1.derToOid(r.csrSignatureOid)),
              (c.siginfo.parameters = h(
                c.siginfo.algorithmOid,
                r.csrSignatureParams,
                !1
              )),
              (c.signature = r.csrSignature),
              (c.certificationRequestInfo = r.certificationRequestInfo),
              t)
            ) {
              if (((c.md = null), c.signatureOid in s))
                switch (s[c.signatureOid]) {
                  case "sha1WithRSAEncryption":
                    c.md = n.md.sha1.create();
                    break;
                  case "md5WithRSAEncryption":
                    c.md = n.md.md5.create();
                    break;
                  case "sha256WithRSAEncryption":
                  case "RSASSA-PSS":
                    c.md = n.md.sha256.create();
                    break;
                  case "sha384WithRSAEncryption":
                    c.md = n.md.sha384.create();
                    break;
                  case "sha512WithRSAEncryption":
                    c.md = n.md.sha512.create();
                }
              if (null === c.md)
                throw (
                  (((u = Error(
                    "Could not compute certification request digest. Unknown signature OID."
                  )).signatureOid = c.signatureOid),
                  u)
                );
              var u,
                l = i.toDer(c.certificationRequestInfo);
              c.md.update(l.getBytes());
            }
            var _ = n.md.sha1.create();
            return (
              (c.subject.getField = function (e) {
                return f(c.subject, e);
              }),
              (c.subject.addField = function (e) {
                $([e]), c.subject.attributes.push(e);
              }),
              (c.subject.attributes = a.RDNAttributesAsArray(
                r.certificationRequestInfoSubject,
                _
              )),
              (c.subject.hash = _.digest().toHex()),
              (c.publicKey = a.publicKeyFromAsn1(r.subjectPublicKeyInfo)),
              (c.getAttribute = function (e) {
                return f(c, e);
              }),
              (c.addAttribute = function (e) {
                $([e]), c.attributes.push(e);
              }),
              (c.attributes = a.CRIAttributesAsArray(
                r.certificationRequestInfoAttributes || []
              )),
              c
            );
          }),
          (a.createCertificationRequest = function () {
            var e = {
              version: 0,
              signatureOid: null,
              signature: null,
              siginfo: {},
            };
            return (
              (e.siginfo.algorithmOid = null),
              (e.subject = {}),
              (e.subject.getField = function (t) {
                return f(e.subject, t);
              }),
              (e.subject.addField = function (t) {
                $([t]), e.subject.attributes.push(t);
              }),
              (e.subject.attributes = []),
              (e.subject.hash = null),
              (e.publicKey = null),
              (e.attributes = []),
              (e.getAttribute = function (t) {
                return f(e, t);
              }),
              (e.addAttribute = function (t) {
                $([t]), e.attributes.push(t);
              }),
              (e.md = null),
              (e.setSubject = function (t) {
                $(t), (e.subject.attributes = t), (e.subject.hash = null);
              }),
              (e.setAttributes = function (t) {
                $(t), (e.attributes = t);
              }),
              (e.sign = function (t, r) {
                e.md = r || n.md.sha1.create();
                var o = s[e.md.algorithm + "WithRSAEncryption"];
                if (!o) {
                  var c = Error(
                    "Could not compute certification request digest. Unknown message digest algorithm OID."
                  );
                  throw ((c.algorithm = e.md.algorithm), c);
                }
                (e.signatureOid = e.siginfo.algorithmOid = o),
                  (e.certificationRequestInfo =
                    a.getCertificationRequestInfo(e));
                var u = i.toDer(e.certificationRequestInfo);
                e.md.update(u.getBytes()), (e.signature = t.sign(e.md));
              }),
              (e.verify = function () {
                var t,
                  r,
                  o,
                  c,
                  u = !1,
                  l = e.md;
                if (null === l) {
                  if (e.signatureOid in s)
                    switch (s[e.signatureOid]) {
                      case "sha1WithRSAEncryption":
                        l = n.md.sha1.create();
                        break;
                      case "md5WithRSAEncryption":
                        l = n.md.md5.create();
                        break;
                      case "sha256WithRSAEncryption":
                      case "RSASSA-PSS":
                        l = n.md.sha256.create();
                        break;
                      case "sha384WithRSAEncryption":
                        l = n.md.sha384.create();
                        break;
                      case "sha512WithRSAEncryption":
                        l = n.md.sha512.create();
                    }
                  if (null === l)
                    throw (
                      (((c = Error(
                        "Could not compute certification request digest. Unknown signature OID."
                      )).signatureOid = e.signatureOid),
                      c)
                    );
                  var _ =
                      e.certificationRequestInfo ||
                      a.getCertificationRequestInfo(e),
                    p = i.toDer(_);
                  l.update(p.getBytes());
                }
                if (null !== l) {
                  switch (e.signatureOid) {
                    case s.sha1WithRSAEncryption:
                      break;
                    case s["RSASSA-PSS"]:
                      if (
                        void 0 ===
                          (r =
                            s[e.signatureParameters.mgf.hash.algorithmOid]) ||
                        void 0 === n.md[r]
                      )
                        throw (
                          (((c = Error("Unsupported MGF hash function.")).oid =
                            e.signatureParameters.mgf.hash.algorithmOid),
                          (c.name = r),
                          c)
                        );
                      if (
                        void 0 ===
                          (o = s[e.signatureParameters.mgf.algorithmOid]) ||
                        void 0 === n.mgf[o]
                      )
                        throw (
                          (((c = Error("Unsupported MGF function.")).oid =
                            e.signatureParameters.mgf.algorithmOid),
                          (c.name = o),
                          c)
                        );
                      if (
                        ((o = n.mgf[o].create(n.md[r].create())),
                        void 0 ===
                          (r = s[e.signatureParameters.hash.algorithmOid]) ||
                          void 0 === n.md[r])
                      )
                        throw (
                          (((c = Error(
                            "Unsupported RSASSA-PSS hash function."
                          )).oid = e.signatureParameters.hash.algorithmOid),
                          (c.name = r),
                          c)
                        );
                      t = n.pss.create(
                        n.md[r].create(),
                        o,
                        e.signatureParameters.saltLength
                      );
                  }
                  u = e.publicKey.verify(l.digest().getBytes(), e.signature, t);
                }
                return u;
              }),
              e
            );
          });
        var m = new Date("1950-01-01T00:00:00Z"),
          v = new Date("2050-01-01T00:00:00Z");
        function C(e) {
          return e >= m && e < v
            ? i.create(
                i.Class.UNIVERSAL,
                i.Type.UTCTIME,
                !1,
                i.dateToUtcTime(e)
              )
            : i.create(
                i.Class.UNIVERSAL,
                i.Type.GENERALIZEDTIME,
                !1,
                i.dateToGeneralizedTime(e)
              );
        }
        (a.getTBSCertificate = function (e) {
          var t = C(e.validity.notBefore),
            r = C(e.validity.notAfter),
            s = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
              i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, [
                i.create(
                  i.Class.UNIVERSAL,
                  i.Type.INTEGER,
                  !1,
                  i.integerToDer(e.version).getBytes()
                ),
              ]),
              i.create(
                i.Class.UNIVERSAL,
                i.Type.INTEGER,
                !1,
                n.util.hexToBytes(e.serialNumber)
              ),
              i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                i.create(
                  i.Class.UNIVERSAL,
                  i.Type.OID,
                  !1,
                  i.oidToDer(e.siginfo.algorithmOid).getBytes()
                ),
                y(e.siginfo.algorithmOid, e.siginfo.parameters),
              ]),
              d(e.issuer),
              i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [t, r]),
              d(e.subject),
              a.publicKeyToAsn1(e.publicKey),
            ]);
          return (
            e.issuer.uniqueId &&
              s.value.push(
                i.create(i.Class.CONTEXT_SPECIFIC, 1, !0, [
                  i.create(
                    i.Class.UNIVERSAL,
                    i.Type.BITSTRING,
                    !1,
                    "\0" + e.issuer.uniqueId
                  ),
                ])
              ),
            e.subject.uniqueId &&
              s.value.push(
                i.create(i.Class.CONTEXT_SPECIFIC, 2, !0, [
                  i.create(
                    i.Class.UNIVERSAL,
                    i.Type.BITSTRING,
                    !1,
                    "\0" + e.subject.uniqueId
                  ),
                ])
              ),
            e.extensions.length > 0 &&
              s.value.push(a.certificateExtensionsToAsn1(e.extensions)),
            s
          );
        }),
          (a.getCertificationRequestInfo = function (e) {
            return i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
              i.create(
                i.Class.UNIVERSAL,
                i.Type.INTEGER,
                !1,
                i.integerToDer(e.version).getBytes()
              ),
              d(e.subject),
              a.publicKeyToAsn1(e.publicKey),
              (function e(t) {
                var r = i.create(i.Class.CONTEXT_SPECIFIC, 0, !0, []);
                if (0 === t.attributes.length) return r;
                for (var a = t.attributes, s = 0; s < a.length; ++s) {
                  var o = a[s],
                    c = o.value,
                    u = i.Type.UTF8;
                  "valueTagClass" in o && (u = o.valueTagClass),
                    u === i.Type.UTF8 && (c = n.util.encodeUtf8(c));
                  var l = !1;
                  "valueConstructed" in o && (l = o.valueConstructed);
                  var _ = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                    i.create(
                      i.Class.UNIVERSAL,
                      i.Type.OID,
                      !1,
                      i.oidToDer(o.type).getBytes()
                    ),
                    i.create(i.Class.UNIVERSAL, i.Type.SET, !0, [
                      i.create(i.Class.UNIVERSAL, u, l, c),
                    ]),
                  ]);
                  r.value.push(_);
                }
                return r;
              })(e),
            ]);
          }),
          (a.distinguishedNameToAsn1 = function (e) {
            return d(e);
          }),
          (a.certificateToAsn1 = function (e) {
            var t = e.tbsCertificate || a.getTBSCertificate(e);
            return i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
              t,
              i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                i.create(
                  i.Class.UNIVERSAL,
                  i.Type.OID,
                  !1,
                  i.oidToDer(e.signatureOid).getBytes()
                ),
                y(e.signatureOid, e.signatureParameters),
              ]),
              i.create(
                i.Class.UNIVERSAL,
                i.Type.BITSTRING,
                !1,
                "\0" + e.signature
              ),
            ]);
          }),
          (a.certificateExtensionsToAsn1 = function (e) {
            var t = i.create(i.Class.CONTEXT_SPECIFIC, 3, !0, []),
              r = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, []);
            t.value.push(r);
            for (var n = 0; n < e.length; ++n)
              r.value.push(a.certificateExtensionToAsn1(e[n]));
            return t;
          }),
          (a.certificateExtensionToAsn1 = function (e) {
            var t = i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, []);
            t.value.push(
              i.create(
                i.Class.UNIVERSAL,
                i.Type.OID,
                !1,
                i.oidToDer(e.id).getBytes()
              )
            ),
              e.critical &&
                t.value.push(
                  i.create(i.Class.UNIVERSAL, i.Type.BOOLEAN, !1, "\xff")
                );
            var r = e.value;
            return (
              "string" != typeof e.value && (r = i.toDer(r).getBytes()),
              t.value.push(
                i.create(i.Class.UNIVERSAL, i.Type.OCTETSTRING, !1, r)
              ),
              t
            );
          }),
          (a.certificationRequestToAsn1 = function (e) {
            var t =
              e.certificationRequestInfo || a.getCertificationRequestInfo(e);
            return i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
              t,
              i.create(i.Class.UNIVERSAL, i.Type.SEQUENCE, !0, [
                i.create(
                  i.Class.UNIVERSAL,
                  i.Type.OID,
                  !1,
                  i.oidToDer(e.signatureOid).getBytes()
                ),
                y(e.signatureOid, e.signatureParameters),
              ]),
              i.create(
                i.Class.UNIVERSAL,
                i.Type.BITSTRING,
                !1,
                "\0" + e.signature
              ),
            ]);
          }),
          (a.createCaStore = function (e) {
            var t = { certs: {} };
            function r(e) {
              return s(e), t.certs[e.hash] || null;
            }
            function s(e) {
              if (!e.hash) {
                var t = n.md.sha1.create();
                (e.attributes = a.RDNAttributesAsArray(d(e), t)),
                  (e.hash = t.digest().toHex());
              }
            }
            if (
              ((t.getIssuer = function (e) {
                return r(e.issuer);
              }),
              (t.addCertificate = function (e) {
                if (
                  ("string" == typeof e && (e = n.pki.certificateFromPem(e)),
                  s(e.subject),
                  !t.hasCertificate(e))
                ) {
                  if (e.subject.hash in t.certs) {
                    var r = t.certs[e.subject.hash];
                    n.util.isArray(r) || (r = [r]),
                      r.push(e),
                      (t.certs[e.subject.hash] = r);
                  } else t.certs[e.subject.hash] = e;
                }
              }),
              (t.hasCertificate = function (e) {
                "string" == typeof e && (e = n.pki.certificateFromPem(e));
                var t = r(e.subject);
                if (!t) return !1;
                n.util.isArray(t) || (t = [t]);
                for (
                  var s = i.toDer(a.certificateToAsn1(e)).getBytes(), o = 0;
                  o < t.length;
                  ++o
                )
                  if (s === i.toDer(a.certificateToAsn1(t[o])).getBytes())
                    return !0;
                return !1;
              }),
              (t.listAllCertificates = function () {
                var e = [];
                for (var r in t.certs)
                  if (t.certs.hasOwnProperty(r)) {
                    var i = t.certs[r];
                    if (n.util.isArray(i))
                      for (var a = 0; a < i.length; ++a) e.push(i[a]);
                    else e.push(i);
                  }
                return e;
              }),
              (t.removeCertificate = function (e) {
                if (
                  ("string" == typeof e && (e = n.pki.certificateFromPem(e)),
                  s(e.subject),
                  !t.hasCertificate(e))
                )
                  return null;
                var o,
                  c = r(e.subject);
                if (!n.util.isArray(c))
                  return (
                    (o = t.certs[e.subject.hash]),
                    delete t.certs[e.subject.hash],
                    o
                  );
                for (
                  var u = i.toDer(a.certificateToAsn1(e)).getBytes(), l = 0;
                  l < c.length;
                  ++l
                )
                  u === i.toDer(a.certificateToAsn1(c[l])).getBytes() &&
                    ((o = c[l]), c.splice(l, 1));
                return 0 === c.length && delete t.certs[e.subject.hash], o;
              }),
              e)
            )
              for (var o = 0; o < e.length; ++o) {
                var c = e[o];
                t.addCertificate(c);
              }
            return t;
          }),
          (a.certificateError = {
            bad_certificate: "forge.pki.BadCertificate",
            unsupported_certificate: "forge.pki.UnsupportedCertificate",
            certificate_revoked: "forge.pki.CertificateRevoked",
            certificate_expired: "forge.pki.CertificateExpired",
            certificate_unknown: "forge.pki.CertificateUnknown",
            unknown_ca: "forge.pki.UnknownCertificateAuthority",
          }),
          (a.verifyCertificateChain = function (e, t, r) {
            "function" == typeof r && (r = { verify: r }), (r = r || {});
            var i = (t = t.slice(0)).slice(0),
              s = r.validityCheckDate;
            void 0 === s && (s = new Date());
            var o = !0,
              c = null,
              u = 0;
            do {
              var l = t.shift(),
                _ = null,
                p = !1;
              if (
                (s &&
                  (s < l.validity.notBefore || s > l.validity.notAfter) &&
                  (c = {
                    message: "Certificate is not valid yet or has expired.",
                    error: a.certificateError.certificate_expired,
                    notBefore: l.validity.notBefore,
                    notAfter: l.validity.notAfter,
                    now: s,
                  }),
                null === c)
              ) {
                if (
                  (null === (_ = t[0] || e.getIssuer(l)) &&
                    l.isIssuer(l) &&
                    ((p = !0), (_ = l)),
                  _)
                ) {
                  var f = _;
                  n.util.isArray(f) || (f = [f]);
                  for (var h = !1; !h && f.length > 0; ) {
                    _ = f.shift();
                    try {
                      h = _.verify(l);
                    } catch (d) {}
                  }
                  h ||
                    (c = {
                      message: "Certificate signature is invalid.",
                      error: a.certificateError.bad_certificate,
                    });
                }
                null !== c ||
                  (_ && !p) ||
                  e.hasCertificate(l) ||
                  (c = {
                    message: "Certificate is not trusted.",
                    error: a.certificateError.unknown_ca,
                  });
              }
              if (
                (null === c &&
                  _ &&
                  !l.isIssuer(_) &&
                  (c = {
                    message: "Certificate issuer is invalid.",
                    error: a.certificateError.bad_certificate,
                  }),
                null === c)
              )
                for (
                  var $ = { keyUsage: !0, basicConstraints: !0 }, g = 0;
                  null === c && g < l.extensions.length;
                  ++g
                ) {
                  var y = l.extensions[g];
                  !y.critical ||
                    y.name in $ ||
                    (c = {
                      message:
                        "Certificate has an unsupported critical extension.",
                      error: a.certificateError.unsupported_certificate,
                    });
                }
              if (null === c && (!o || (0 === t.length && (!_ || p)))) {
                var m = l.getExtension("basicConstraints"),
                  v = l.getExtension("keyUsage");
                null !== v &&
                  ((v.keyCertSign && null !== m) ||
                    (c = {
                      message:
                        "Certificate keyUsage or basicConstraints conflict or indicate that the certificate is not a CA. If the certificate is the only one in the chain or isn't the first then the certificate must be a valid CA.",
                      error: a.certificateError.bad_certificate,
                    })),
                  null !== c ||
                    null === m ||
                    m.cA ||
                    (c = {
                      message:
                        "Certificate basicConstraints indicates the certificate is not a CA.",
                      error: a.certificateError.bad_certificate,
                    }),
                  null === c &&
                    null !== v &&
                    "pathLenConstraint" in m &&
                    u - 1 > m.pathLenConstraint &&
                    (c = {
                      message:
                        "Certificate basicConstraints pathLenConstraint violated.",
                      error: a.certificateError.bad_certificate,
                    });
              }
              var C = null === c || c.error,
                E = r.verify ? r.verify(C, u, i) : C;
              if (!0 !== E)
                throw (
                  (!0 === C &&
                    (c = {
                      message: "The application rejected the certificate.",
                      error: a.certificateError.bad_certificate,
                    }),
                  (E || 0 === E) &&
                    ("object" != typeof E || n.util.isArray(E)
                      ? "string" == typeof E && (c.error = E)
                      : (E.message && (c.message = E.message),
                        E.error && (c.error = E.error))),
                  c)
                );
              (c = null), (o = !1), ++u;
            } while (t.length > 0);
            return !0;
          });
      },
      {
        "./aes": 7,
        "./asn1": 9,
        "./des": 14,
        "./forge": 16,
        "./md": 23,
        "./mgf": 25,
        "./oids": 27,
        "./pem": 30,
        "./pss": 38,
        "./rsa": 41,
        "./util": 48,
      },
    ],
    50: [
      function (e, t, r) {
        var n,
          i,
          a = (t.exports = {});
        function s() {
          throw Error("setTimeout has not been defined");
        }
        function o() {
          throw Error("clearTimeout has not been defined");
        }
        function c(e) {
          if (n === setTimeout) return setTimeout(e, 0);
          if ((n === s || !n) && setTimeout)
            return (n = setTimeout), setTimeout(e, 0);
          try {
            return n(e, 0);
          } catch (t) {
            try {
              return n.call(null, e, 0);
            } catch (r) {
              return n.call(this, e, 0);
            }
          }
        }
        !(function () {
          try {
            n = "function" == typeof setTimeout ? setTimeout : s;
          } catch (e) {
            n = s;
          }
          try {
            i = "function" == typeof clearTimeout ? clearTimeout : o;
          } catch (t) {
            i = o;
          }
        })();
        var u,
          l = [],
          _ = !1,
          p = -1;
        function f() {
          _ &&
            u &&
            ((_ = !1),
            u.length ? (l = u.concat(l)) : (p = -1),
            l.length && h());
        }
        function h() {
          if (!_) {
            var e = c(f);
            _ = !0;
            for (var t = l.length; t; ) {
              for (u = l, l = []; ++p < t; ) u && u[p].run();
              (p = -1), (t = l.length);
            }
            (u = null),
              (_ = !1),
              (function (e) {
                if (i === clearTimeout) return clearTimeout(e);
                if ((i === o || !i) && clearTimeout)
                  return (i = clearTimeout), clearTimeout(e);
                try {
                  i(e);
                } catch (t) {
                  try {
                    return i.call(null, e);
                  } catch (r) {
                    return i.call(this, e);
                  }
                }
              })(e);
          }
        }
        function d(e, t) {
          (this.fun = e), (this.array = t);
        }
        function $() {}
        (a.nextTick = function (e) {
          var t = Array(arguments.length - 1);
          if (arguments.length > 1)
            for (var r = 1; r < arguments.length; r++) t[r - 1] = arguments[r];
          l.push(new d(e, t)), 1 !== l.length || _ || c(h);
        }),
          (d.prototype.run = function () {
            this.fun.apply(null, this.array);
          }),
          (a.title = "browser"),
          (a.browser = !0),
          (a.env = {}),
          (a.argv = []),
          (a.version = ""),
          (a.versions = {}),
          (a.on = $),
          (a.addListener = $),
          (a.once = $),
          (a.off = $),
          (a.removeListener = $),
          (a.removeAllListeners = $),
          (a.emit = $),
          (a.prependListener = $),
          (a.prependOnceListener = $),
          (a.listeners = function (e) {
            return [];
          }),
          (a.binding = function (e) {
            throw Error("process.binding is not supported");
          }),
          (a.cwd = function () {
            return "/";
          }),
          (a.chdir = function (e) {
            throw Error("process.chdir is not supported");
          }),
          (a.umask = function () {
            return 0;
          });
      },
      {},
    ],
    51: [
      function (e, t, r) {
        (function (t, n) {
          var i = e("process/browser.js").nextTick,
            a = Function.prototype.apply,
            s = Array.prototype.slice,
            o = {},
            c = 0;
          function u(e, t) {
            (this._id = e), (this._clearFn = t);
          }
          (r.setTimeout = function () {
            return new u(a.call(setTimeout, window, arguments), clearTimeout);
          }),
            (r.setInterval = function () {
              return new u(
                a.call(setInterval, window, arguments),
                clearInterval
              );
            }),
            (r.clearTimeout = r.clearInterval =
              function (e) {
                e.close();
              }),
            (u.prototype.unref = u.prototype.ref = function () {}),
            (u.prototype.close = function () {
              this._clearFn.call(window, this._id);
            }),
            (r.enroll = function (e, t) {
              clearTimeout(e._idleTimeoutId), (e._idleTimeout = t);
            }),
            (r.unenroll = function (e) {
              clearTimeout(e._idleTimeoutId), (e._idleTimeout = -1);
            }),
            (r._unrefActive = r.active =
              function (e) {
                clearTimeout(e._idleTimeoutId);
                var t = e._idleTimeout;
                t >= 0 &&
                  (e._idleTimeoutId = setTimeout(function () {
                    e._onTimeout && e._onTimeout();
                  }, t));
              }),
            (r.setImmediate =
              "function" == typeof t
                ? t
                : function (e) {
                    var t = c++,
                      n = !(arguments.length < 2) && s.call(arguments, 1);
                    return (
                      (o[t] = !0),
                      i(function () {
                        o[t] &&
                          (n ? e.apply(null, n) : e.call(null),
                          r.clearImmediate(t));
                      }),
                      t
                    );
                  }),
            (r.clearImmediate =
              "function" == typeof n
                ? n
                : function (e) {
                    delete o[e];
                  });
        }).call(this, e("timers").setImmediate, e("timers").clearImmediate);
      },
      { "process/browser.js": 50, timers: 51 },
    ],
    52: [
      function (e, t, r) {
        t.exports = {
          name: "hybrid-crypto-js",
          version: "0.2.2",
          description:
            "Hybrid (RSA+AES) encryption and decryption toolkit for JavaScript",
          main: "lib/index.js",
          scripts: {
            prepublish: "npm run build",
            webpack: "browserify lib/webpack.js -o web/hybrid-crypto.js",
            uglify: "uglifyjs web/hybrid-crypto.js -o web/hybrid-crypto.min.js",
            flow: "flow",
            babel: "babel src/ -d lib/",
            build: "npm run babel && npm run webpack && npm run uglify",
            test: "npm run babel && mocha -R spec",
          },
          repository: {
            type: "git",
            url: "https://github.com/juhoen/hybrid-crypto-js.git",
          },
          keywords: ["rsa", "aes", "rsa+aes", "react", "node", "react-native"],
          author: "Juho Enala <juho.enala@gmail.com>",
          license: "MIT",
          bugs: { url: "https://github.com/juhoen/hybrid-crypto-js/issues" },
          homepage: "https://github.com/juhoen/hybrid-crypto-js",
          dependencies: { "node-forge": "^0.8.5" },
          devDependencies: {
            "@babel/cli": "^7.5.5",
            "@babel/core": "^7.5.5",
            "@babel/preset-env": "^7.5.5",
            "@babel/preset-flow": "^7.0.0",
            "babel-core": "^6.26.0",
            "babel-preset-env": "1.6.0",
            "babel-preset-es2015": "^6.24.1",
            babelify: "^8.0.0",
            browserify: "^16.5.0",
            chai: "^4.1.2",
            "flow-bin": "^0.107.0",
            mocha: "^4.0.1",
            prettier: "^1.18.2",
            "uglify-js": "^3.2.1",
          },
          browserslist: "> 0.25%, not dead",
        };
      },
      {},
    ],
  },
  {},
  [5]
),
  function () {
    var e = document.querySelector(
      'script[src="https://checkout.epayco.co/checkout.js"]'
    );
    e &&
      1 === e.src.split("&").length &&
      (e.src = e.src + "?version=" + new Date().getTime());
  }.call(this),
  (function (e, t) {
    "use strict";
    "function" == typeof define && define.amd
      ? define(function () {
          return t(e);
        })
      : "function" == typeof module && module.exports
      ? (module.exports = t(e))
      : t(e);
  })(this, function (e) {
    "use strict";
    var t,
      r,
      n,
      i,
      a,
      s,
      o,
      c,
      u,
      l = e.document,
      _ = l.createElement("_"),
      p = "DOMAttrModified";
    function f() {
      var e,
        s = {};
      for (r = this.attributes, n = 0, o = r.length; n < o; n += 1)
        (c = (t = r[n]).name.match(a)) &&
          (s[
            (e = c[1]).replace(i, function (e, t) {
              return t.toUpperCase();
            })
          ] = t.value);
      return s;
    }
    function h() {
      s ? _.removeEventListener(p, h, !1) : _.detachEvent("on" + p, h),
        (u = !0);
    }
    void 0 === _.dataset &&
      ((i = /\-([a-z])/gi),
      (a = /^data\-(.+)/),
      (s = !!l.addEventListener),
      (u = !1),
      s ? _.addEventListener(p, h, !1) : _.attachEvent("on" + p, h),
      _.setAttribute("foo", "bar"),
      Object.defineProperty(e.Element.prototype, "dataset", {
        get: u
          ? function () {
              return (
                this._datasetCache || (this._datasetCache = f.call(this)),
                this._datasetCache
              );
            }
          : f,
      }),
      u &&
        s &&
        l.addEventListener(
          p,
          function (e) {
            delete e.target._datasetCache;
          },
          !1
        ));
  }),
  (function () {
    var e,
      t = "EpaycoCheckout.require".split("."),
      r = t[t.length - 1],
      n = this;
    for (e = 0; e < t.length - 1; e += 1) n = n[t[e]] = n[t[e]] || {};
    void 0 === n[r] &&
      (n[r] = function () {
        var e = {},
          t = {},
          r = function (e, t) {
            for (
              var r,
                n,
                i = [],
                a = 0,
                s = (r = /^\.\.?(\/|$)/.test(t)
                  ? [e, t].join("/").split("/")
                  : t.split("/")).length;
              a < s;
              a += 1
            )
              ".." == (n = r[a]) ? i.pop() : "." != n && "" != n && i.push(n);
            return i.join("/");
          },
          n = function (i) {
            return (function (i, a) {
              var s,
                o,
                c = r("", i),
                u = r(c, "./index");
              if ((s = t[c] || t[u])) return s;
              if ((o = e[c] || e[(c = u)]))
                return (
                  (s = { id: c, exports: {} }),
                  (t[c] = s.exports),
                  o(
                    s.exports,
                    function (e) {
                      var t;
                      return n(e, (t = c).split("/").slice(0, -1).join("/"));
                    },
                    s
                  ),
                  (t[c] = s.exports)
                );
              throw "module " + i + " not found";
            })(i, "");
          };
        return (
          (n.define = function (t) {
            for (var r in t) e[r] = t[r];
          }),
          (n.modules = e),
          (n.cache = t),
          n
        );
      }.call());
  })(),
  EpaycoCheckout.require.define({
    "outer/controllers/button": function (e, t, r) {
      (function () {
        var e,
          n,
          i,
          a,
          s,
          o,
          c,
          u = function (e, t) {
            return function () {
              return e.apply(t, arguments);
            };
          };
        (e = (_ref = t("outer/lib/utils")).$$),
          (i = _ref.hasClass),
          (a = _ref.addClass),
          (s = _ref.append),
          _ref.text,
          (o = _ref.insertAfter),
          (c = _ref.hasAttr),
          (helpers = t("lib/helpers")),
          (utils = t("outer/lib/utils")),
          (Iframe = t("outer/controllers/iframe")),
          (n = (function () {
            function t(e, t) {
              e.setAttribute(
                "src",
                e.getAttribute("src") + "?version=" + new Date().getTime()
              ),
                (this.scriptEl = e),
                (this.dataset = this.scriptEl.dataset),
                (this.open = u(this.open, this)),
                (this.submit = u(this.submit, this)),
                (this.parentHead = u(this.parentHead, this)),
                (this.append = u(this.append, this)),
                (this.render = u(this.render, this)),
                (this.document = this.scriptEl.ownerDocument),
                (this.$el = document.createElement("button")),
                this.dataset && this.dataset.epaycoHidden
                  ? this.$el.setAttribute("style", "display: none")
                  : this.$el.setAttribute(
                      "style",
                      "padding: 0; background: none; border: none; cursor: pointer;"
                    ),
                this.$el.removeAttribute("disabled"),
                (this.$el.className = "epayco-button-render"),
                helpers.bind(this.$el, "click", this.submit),
                this.render(e);
            }
            return (
              (t.totalButtonId = 0),
              (t.load = function (r) {
                var n, s;
                if (
                  ((s = e("epayco-button")),
                  (s = (s = (function () {
                    var e, t, r;
                    for (r = [], e = 0, t = s.length; e < t; e += 1)
                      i((n = s[e]), "active") || r.push(n);
                    return r;
                  })())[s.length - 1]))
                )
                  return a(s, "active"), new t(s, r).append();
              }),
              (t.prototype.render = function (e) {
                (this.$el.innerHTML = ""),
                  (this.$scriptIp = document.createElement("script")),
                  (this.$styleTag = document.createElement("style")),
                  (this.$styleTag.type = "text/css"),
                  (this.$styleTag.className = "styleEpayco"),
                  this.$styleTag.appendChild(
                    document.createTextNode(
                      ".epayco-button-render:focus {outline:0}"
                    )
                  ),
                  (this.$img = document.createElement("img"));
                var t = this.scriptEl.dataset;
                t && t.epaycoButton
                  ? (this.$img.src = e.dataset.epaycoButton)
                  : (this.$img.src =
                      "https://369969691f476073508a-60bf0867add971908d4f26a64519c2aa.ssl.cf5.rackcdn.com/btns/epayco/boton_de_cobro_epayco2.png"),
                  "true" === t.epaycoAutoclick && this.open();
                try {
                  t.epaycoSignature = helpers.parseParamsForScript(t);
                } catch (r) {
                  console.error("error create siganture", r);
                }
                return s(this.$el, this.$img);
              }),
              (t.prototype.append = function () {
                var e = this.parentHead();
                this.scriptEl &&
                  (o(this.scriptEl, this.$el),
                  0 === document.getElementsByClassName("styleEpayco").length &&
                    o(e, this.$styleTag));
              }),
              (t.prototype.isDisabled = function () {
                return c(this.$el, "disabled");
              }),
              (t.prototype.parentHead = function () {
                var e, t;
                return (
                  (null != (e = this.document) ? e.head : void 0) ||
                  (null != (t = this.document)
                    ? t.getElementsByTagName("head")[0]
                    : void 0) ||
                  this.document.body
                );
              }),
              (t.prototype.submit = function (e) {
                return (
                  this.$el.setAttribute(
                    "style",
                    "padding: 0; background: none; border: none; cursor: pointer; pointer-events: none;"
                  ),
                  "function" == typeof e.preventDefault && e.preventDefault(),
                  this.isDisabled() || this.open(this),
                  !1
                );
              }),
              (t.prototype.open = function (e) {
                (this.scriptEl.dataset.epaycoImplementationType = "script"),
                  helpers.onlineCheckout(this.$el, this.scriptEl.dataset);
              }),
              t
            );
          })()),
          (r.exports = n);
      }).call(this);
    },
  }),
  EpaycoCheckout.require.define({
    "outer/lib/utils": function (e, t, r) {
      (function () {
        var e,
          t,
          n,
          i,
          a,
          s,
          o,
          c,
          u =
            [].indexOf ||
            function (e) {
              for (var t = 0, r = this.length; t < r; t += 1)
                if (t in this && this[t] === e) return t;
              return -1;
            };
        (e = function (e) {
          return document.querySelectorAll(e);
        }),
          (t = function (e) {
            var t, r, n, i, a, s;
            if ("function" == typeof document.getElementsByClassName)
              return document.getElementsByClassName(e);
            if ("function" == typeof document.querySelectorAll)
              return document.querySelectorAll("." + e);
            for (
              r = RegExp("(^|\\s)" + e + "(\\s|$)"),
                s = [],
                n = 0,
                i = (a = document.getElementsByTagName("*")).length;
              n < i;
              n += 1
            )
              (t = a[n]), r.test(t.className) && s.push(t);
            return s;
          }),
          (n = function (e, t) {
            return u.call(e.className.split(" "), t) >= 0;
          }),
          (i = function (e, t) {
            return (e.className += " " + t);
          }),
          (a = function (e, t) {
            return e.appendChild(t);
          }),
          (s = function (e, t) {
            return (
              "innerText" in e ? (e.innerText = t) : (e.textContent = t), t
            );
          }),
          (o = function (e, t) {
            return e.parentNode.insertBefore(t, e.nextSibling);
          }),
          (c = function (e, t) {
            var r;
            return "function" == typeof e.hasAttribute
              ? e.hasAttribute(t)
              : !(
                  !(r = e.getAttributeNode(t)) ||
                  (!r.specified && !r.nodeValue)
                );
          }),
          (r.exports = {
            $: e,
            $$: t,
            hasClass: n,
            addClass: i,
            append: a,
            text: s,
            insertAfter: o,
            hasAttr: c,
          });
      }).call(this);
    },
  }),
  EpaycoCheckout.require.define({
    "lib/helpers": function (e, t, r) {
      (function () {
        (Iframe = t("outer/controllers/iframe")),
          (helpers = {
            userAgent: window.navigator.userAgent,
            isMobile: function () {
              var e,
                t = !1;
              return (
                (e = navigator.userAgent || navigator.vendor || window.opera),
                (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
                  e
                ) ||
                  /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                    e.substr(0, 4)
                  )) &&
                  (t = !0),
                t
              );
            },
            checkNested: function (e) {
              for (
                var t = Array.prototype.slice.call(arguments, 1), r = 0;
                r < t.length;
                r++
              ) {
                if (!e || !e.hasOwnProperty(t[r])) return !1;
                e = e[t[r]];
              }
              return !0;
            },
            isEmptyObject: function (e) {
              for (var t in e) if (e.hasOwnProperty(t)) return !1;
              return !0;
            },
            initParams: function (e) {
              var t = {};
              return (
                (t.lightbox =
                  !!helpers.checkNested(e, "data", "modules", "lightbox") &&
                  e.data.modules.lightbox),
                (t.movil =
                  !helpers.checkNested(e, "data", "modules", "movil") ||
                  e.data.modules.movil),
                t
              );
            },
            isExternal: function (e) {
              return "true" == e || !0 === e;
            },
            bind: function (e, t, r) {
              return e.addEventListener
                ? e.addEventListener(t, r, !1)
                : e.attachEvent("on" + t, r);
            },
            getIpClient: function (e) {
              if (window.XMLHttpRequest) var t = new XMLHttpRequest();
              else t = new ActiveXObject("Microsoft.XMLHTTP");
              (t.onreadystatechange = function () {
                4 == this.readyState &&
                  200 == this.status &&
                  (this.responseText.toLowerCase().indexOf("{") >= 0
                    ? e(JSON.parse(this.responseText).data)
                    : e("0.0.0.0"));
              }),
                t.open("GET", "https://apify-private.epayco.co/getip", !0),
                t.send();
            },
            generateGuid: function () {
              function e() {
                return Math.floor(65536 * (1 + Math.random()))
                  .toString(16)
                  .substring(1);
              }
              return (
                e() +
                e() +
                "-" +
                e() +
                "-" +
                e() +
                "-" +
                e() +
                "-" +
                e() +
                e() +
                e()
              );
            },
            isSession: function () {
              return (
                (void 0 === localStorage.getItem("keySessionPay")
                  ? localStorage.setItem(
                      "keySessionPay",
                      helpers.generateGuid()
                    )
                  : localStorage.getItem("keySessionPay")) ||
                helpers.generateGuid()
              );
            },
            getEndPoint: function (e) {
              return e
                ? "https://msecure.epayco.co"
                : "https://secure.epayco.co";
            },
            parseOptions: function (e) {
              var t = {};
              for (var r in e)
                e.hasOwnProperty(r) &&
                  (t[r] =
                    "epaycoConfirmation" === r || "epaycoResponse" === r
                      ? this.encodeUri(e[r])
                      : e[r]);
              return t;
            },
            generateTransactionId: function (e, t) {
              e = this.parseOptions(e);
              var r =
                  this.getEndPoint() +
                  `/create/transaction/${e.epaycoKey}/${this.isSession()}`,
                n = new XMLHttpRequest();
              window.postMessage({ event: "onLoadTransactionId" }, "*"),
                n.open("POST", r),
                n.setRequestHeader(
                  "Content-type",
                  "application/x-www-form-urlencoded"
                ),
                (n.onreadystatechange = function () {
                  if (4 === this.readyState && 200 === this.status) {
                    window.postMessage(
                      { event: "onCreatedTransactionId" },
                      "*"
                    );
                    var e = JSON.parse(this.responseText);
                    e ? t(null, e) : t("error", null);
                  }
                }),
                n.send("fname=" + this.encodeUri(JSON.stringify(e)));
            },
            generateStandardCheckout: function (e) {
              var t = this;
              helpers.getIpClient(function (r) {
                (e.epaycoIp = r),
                  e.epaycoSessionId
                    ? (window.location =
                        t.getEndPoint() +
                        "/payment/methods?transaction=" +
                        e.epaycoSessionId)
                    : t.generateTransactionId(e, function (e, r) {
                        e
                          ? console.log(
                              "Error generando el checkout contacte con soporte"
                            )
                          : (window.location =
                              t.getEndPoint() +
                              `/payment/methods?transaction=${r.data.id_session}`);
                      });
              });
            },
            generateMovilCheckout: function (e) {
              var t = this;
              helpers.getIpClient(function (r) {
                (e.epaycoIp = r),
                  e.epaycoSessionId
                    ? (window.location =
                        t.getEndPoint(!0) +
                        "/v1/transaction/payment.html?transaction=" +
                        e.epaycoSessionId)
                    : t.generateTransactionId(e, function (e, r) {
                        e
                          ? console.log(
                              "Error generando el checkout contacte con soporte"
                            )
                          : (window.location =
                              t.getEndPoint(!0) +
                              "/v1/transaction/payment.html?transaction=" +
                              r.data.id_session);
                      });
              });
            },
            generateUrlOnePageCheckout: function (e, t) {
              var r = this;
              helpers.getIpClient(function (n) {
                (e.epaycoIp = n),
                  e.epaycoSessionId
                    ? t(
                        r.getEndPoint() +
                          "/czgvMpNW3YEaaFhLee?transaction=" +
                          e.epaycoSessionId
                      )
                    : r.generateTransactionId(e, function (e, r) {
                        e
                          ? console.log(
                              "Error al validar la llave del cliente, por favor compruebe"
                            )
                          : t(
                              helpers.getEndPoint() +
                                `/czgvMpNW3YEaaFhLee?transaction=${r.data.id_session}`
                            );
                      });
              });
            },
            generateWithOutCheckout: function (e) {
              this.generateUrlOnePageCheckout(e, function (e) {
                window.location = e;
              });
            },
            generateOnePageCheckout: function (e, t) {
              Iframe(e, !0, t);
            },
            validateForEncrypt: function (e, t) {
              var r,
                n = {
                  epaycoName: { required: !0, type: "string" },
                  epaycoResponse: { format: "url" },
                  epaycoConfirmation: { format: "url" },
                  epaycoExtra1: { format: "string" },
                  epaycoExtra2: { format: "string" },
                  epaycoExtra3: { format: "string" },
                  epaycoExtra4: { format: "string" },
                  epaycoExtra5: { format: "string" },
                  epaycoExtra6: { format: "string" },
                  epaycoExtra7: { format: "string" },
                  epaycoExtra8: { format: "string" },
                  epaycoExtra9: { format: "string" },
                  epaycoExtra10: { format: "string" },
                }[e];
              return (
                n &&
                  (t.replace(/\s/g, "").length > 0 || (t = ""),
                  typeof t === n.type && "string" === n.type && (t = String(t)),
                  n.format &&
                    "url" === n.format &&
                    (t = encodeURIComponent((r = String((r = t)))))),
                t
              );
            },
            selectFields: function (e) {
              var t = {},
                r = [
                  "epaycoName",
                  "epaycoAmount",
                  "epaycoTax",
                  "epaycoTaxBase",
                  "epaycoCurrency",
                  "epaycoCountry",
                  "epaycoInvoice",
                  "epaycoExtra1",
                  "epaycoExtra2",
                  "epaycoExtra3",
                  "epaycoExtra4",
                  "epaycoExtra5",
                  "epaycoExtra6",
                  "epaycoExtra7",
                  "epaycoExtra8",
                  "epaycoExtra9",
                  "epaycoExtra10",
                ];
              return (
                Object.keys(e).map((n) => {
                  r.includes(n) &&
                    (t[n] = "epaycoCurrency" === n ? e[n].toUpperCase() : e[n]);
                }),
                t
              );
            },
            encryptObjectSiganature: function (e) {
              var t = new Crypt();
              e = this.selectFields(e);
              try {
                e = JSON.stringify(e);
              } catch (r) {
                throw `Error creando la firma ${r}`;
              }
              let n = t.encrypt(
                "-----BEGIN PUBLIC KEY----- MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA1Ijtd6/YfaLpfK+VSjH2 DYAfsW5EtmYDPAVAM6cIVN7+P6AIz13N5atkKR8Z6rMfErxAU6E1pH6sT2jgVL/O uArJGXROPyNYqPlILon/kpp2Azw44ILo53YW07FoQM/KpG26tY/myHGyykaegDN2 v2KFexsX5oHW0TYl4NbDqRLBCcedaXwWb+gdF1jb/J6kqTdgTxxuABsQC5y1xXw9 9uX/O+JI2SdYmUVg7qq5NQub/9fLiduTxyFJRZRxWvsAyqSV7PquZ6x4r45h6y3D nX/muBIKSyU5T0Om/M93SLzMylsxJKn8T4i6c9BL370J1pV9HAvpv/rbMMeosV/Q thfvjBVSk4yciuIwa5cr+WQx4IZ34v2rA4gazrw2x2U5u6APkyL9DnMCRc48jEo8 lxpEVwdUidhfvC/dDb4xWqj8K2eKxAnzlsnqr8VK6JwHudhyWL5U4ZRRq/JGYmrM WK0KCzBprI5aYjSAmxiqcuHC6+Zegt6+cG3IaT2DplcU8SyK9JqfnKv2Efm/ddid PsolqlR6S5vu+no5vc6OFBpv6OLtvVkWpqOLePapX+UKdNRhKUrTWFSC5a7+nDzS we3An9rHOtuS/SGSr4EjRchMCcugM5+2VpSUeSl7xmL/n1pUTzN0d694/H91ahoj af1z1U704ftu2tva8t2jPu0CAwEAAQ== -----END PUBLIC KEY-----",
                e
              );
              return btoa(n);
            },
            parseParamsForScript: function (e) {
              let t = {};
              try {
                Object.keys(e).map((r) => {
                  if (e.hasOwnProperty(r)) {
                    let n = r.trim(),
                      i = null;
                    (i = "object" == typeof e[r] ? e[r] : String(e[r])),
                      (t[n] = this.validateForEncrypt(n, i));
                  }
                });
              } catch (r) {
                throw `[FormatParamsPaycoHandler]: ${r.message}`;
              }
              if (
                !(
                  t.hasOwnProperty("epaycoName") &&
                  t.hasOwnProperty("epaycoAmount") &&
                  t.hasOwnProperty("epaycoCurrency") &&
                  t.hasOwnProperty("epaycoCountry")
                )
              )
                throw "Verifique si los parametros obligatorios son contenidos";
              return this.encryptObjectSiganature(t);
            },
            onlineCheckout: function (e, t, r) {
              (r = r || this.initParams({})),
                this.isMobile() && r.movil
                  ? this.generateMovilCheckout(t)
                  : this.isExternal(t.epaycoExternal)
                  ? this.generateStandardCheckout(t)
                  : (this.loadStyle(),
                    r.lightbox
                      ? this.generateWithOutCheckout(t)
                      : this.generateOnePageCheckout(t));
            },
            encodeUri: function (e) {
              return encodeURIComponent(e);
            },
            b64EncodeUnicode: function (e) {
              return btoa(
                encodeURIComponent(e).replace(
                  /%([0-9A-F]{2})/g,
                  function (e, t) {
                    return String.fromCharCode(parseInt(t, 16));
                  }
                )
              );
            },
            removeAccent: function (e) {
              var t,
                r,
                n = (e = e.split("")).length;
              for (t = 0; t < n; t++)
                -1 !==
                  (r =
                    "\xc0\xc1\xc2\xc3\xc4\xc5\xe0\xe1\xe2\xe3\xe4\xe5\xdf\xd2\xd3\xd4\xd5\xd5\xd6\xd8\xf2\xf3\xf4\xf5\xf6\xf8\xc8\xc9\xca\xcb\xe8\xe9\xea\xeb\xf0\xc7\xe7\xd0\xcc\xcd\xce\xcf\xec\xed\xee\xef\xd9\xda\xdb\xdc\xf9\xfa\xfb\xfc\xd1\xf1Å Å¡Å¸\xff\xfdÅ½Å¾".indexOf(
                      e[t]
                    )) &&
                  (e[t] =
                    "AAAAAAaaaaaaBOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz"[
                      r
                    ]);
              return e.join("");
            },
            generateSignature: function (e, t, r) {
              var n = t ? e : e.dataset,
                i = {};
              for (var a in n)
                if (n.hasOwnProperty(a)) {
                  let s = [
                    "epaycoConfig",
                    "epaycoTax",
                    "epaycoBaseTax",
                    "epaycoMethodsDisable",
                    "epaycoExtra9",
                    "epaycoExtra10",
                  ];
                  ["epaycoConfirmation", "epaycoResponse"].includes(a)
                    ? (i[a] = this.parseUrlSignature(n[a]))
                    : s.includes(a)
                    ? (i[a] = n[a])
                    : (i[a] = this.parseTextSignature(n[a]));
                }
              r(void 0, btoa(this.removeAccent(JSON.stringify(i))));
            },
            parseTextSignature: function (e) {
              return "" !== (e = String(e))
                ? e.replace(/[|;$"<>()+,]/g, "").trim()
                : e;
            },
            parseUrlSignature: function (e) {
              return encodeURIComponent((e = String(e)));
            },
            loadStyle: function () {
              var e = document.createElement("style");
              (e.innerHTML =
                ".l034d,.l034d:after{border-radius:50%;width:8em;height:8em}.l034d{margin:8rem auto;font-size:10px;position:relative;text-indent:-9999em;border-top:0.5em solid rgba(0,0,0,0.2);border-right:0.5em solid rgba(0,0,0,0.2);border-bottom:0.5em solid rgba(0,0,0,0.2);border-left:0.5em solid #999;-webkit-transform:translateZ(0);-ms-transform:translateZ(0);transform:translateZ(0);-webkit-animation:l034d88 1.1s infinite linear;animation:l034d88 1.1s infinite linear}@-webkit-keyframes l034d88{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg)}100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes l034d88{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg)}100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}"),
                document.head.appendChild(e);
            },
            generateEpaycoLogo: function () {
              var e = document.createElement("div");
              (e.style.width = "400px"),
                (e.style.margin = "0.6rem 0"),
                (e.style.textAlign = "center");
              var t = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
              );
              t.setAttribute("class", "bIl"),
                t.setAttribute("viewBox", "0 0 194 19"),
                t.setAttribute("width", "194"),
                t.setAttribute("height", "19"),
                t.setAttribute("fill", "none");
              var r = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              r.setAttribute("opacity", "0.8"),
                r.setAttribute("fill", "white"),
                r.setAttribute(
                  "d",
                  "M24.644 9.8252V14H23.2378V3.33594H27.1709C28.3379 3.33594 29.251 3.63379 29.9102 4.22949C30.5742 4.8252 30.9062 5.61377 30.9062 6.59521C30.9062 7.63037 30.5815 8.42871 29.9321 8.99023C29.2876 9.54688 28.3623 9.8252 27.1562 9.8252H24.644ZM24.644 8.67529H27.1709C27.9229 8.67529 28.499 8.49951 28.8994 8.14795C29.2998 7.7915 29.5 7.27881 29.5 6.60986C29.5 5.9751 29.2998 5.46729 28.8994 5.08643C28.499 4.70557 27.9497 4.50781 27.2515 4.49316H24.644V8.67529ZM37.293 14C37.2148 13.8438 37.1514 13.5654 37.1025 13.165C36.4727 13.8193 35.7207 14.1465 34.8467 14.1465C34.0654 14.1465 33.4233 13.9268 32.9204 13.4873C32.4224 13.043 32.1733 12.4814 32.1733 11.8027C32.1733 10.9775 32.4858 10.3379 33.1108 9.88379C33.7407 9.4248 34.6245 9.19531 35.7622 9.19531H37.0806V8.57275C37.0806 8.09912 36.939 7.72314 36.6558 7.44482C36.3726 7.16162 35.9551 7.02002 35.4033 7.02002C34.9199 7.02002 34.5146 7.14209 34.1875 7.38623C33.8604 7.63037 33.6968 7.92578 33.6968 8.27246H32.3345C32.3345 7.87695 32.4736 7.49609 32.752 7.12988C33.0352 6.75879 33.416 6.46582 33.8945 6.25098C34.3779 6.03613 34.9077 5.92871 35.4839 5.92871C36.397 5.92871 37.1123 6.1582 37.6299 6.61719C38.1475 7.07129 38.416 7.69873 38.4355 8.49951V12.147C38.4355 12.8745 38.5283 13.4531 38.7139 13.8828V14H37.293ZM35.0444 12.9673C35.4692 12.9673 35.8721 12.8574 36.2529 12.6377C36.6338 12.418 36.9097 12.1323 37.0806 11.7808V10.1548H36.0186C34.3584 10.1548 33.5283 10.6406 33.5283 11.6123C33.5283 12.0371 33.6699 12.3691 33.9531 12.6084C34.2363 12.8477 34.6001 12.9673 35.0444 12.9673ZM40.2373 9.97168C40.2373 8.73633 40.5229 7.75488 41.0942 7.02734C41.6655 6.29492 42.4224 5.92871 43.3647 5.92871C44.3315 5.92871 45.0859 6.27051 45.6279 6.9541L45.6938 6.0752H46.9316V13.8096C46.9316 14.835 46.6265 15.6431 46.0161 16.2339C45.4106 16.8247 44.5952 17.1201 43.5698 17.1201C42.9985 17.1201 42.4395 16.998 41.8926 16.7539C41.3457 16.5098 40.9282 16.1753 40.6401 15.7505L41.3433 14.9375C41.9243 15.6553 42.6348 16.0142 43.4746 16.0142C44.1338 16.0142 44.6465 15.8286 45.0127 15.4575C45.3838 15.0864 45.5693 14.564 45.5693 13.8901V13.209C45.0273 13.834 44.2876 14.1465 43.3501 14.1465C42.4224 14.1465 41.6704 13.7729 41.0942 13.0259C40.5229 12.2788 40.2373 11.2607 40.2373 9.97168ZM41.5996 10.1255C41.5996 11.019 41.7827 11.7222 42.1489 12.2349C42.5151 12.7427 43.0278 12.9966 43.687 12.9966C44.5415 12.9966 45.1689 12.6084 45.5693 11.832V8.21387C45.1543 7.45703 44.5317 7.07861 43.7017 7.07861C43.0425 7.07861 42.5273 7.33496 42.1562 7.84766C41.7852 8.36035 41.5996 9.11963 41.5996 10.1255ZM48.6235 9.96436C48.6235 9.18799 48.7749 8.48975 49.0776 7.86963C49.3853 7.24951 49.8101 6.771 50.3521 6.43408C50.8989 6.09717 51.5215 5.92871 52.2197 5.92871C53.2988 5.92871 54.1704 6.30225 54.8345 7.04932C55.5034 7.79639 55.8379 8.79004 55.8379 10.0303V10.1255C55.8379 10.897 55.689 11.5903 55.3911 12.2056C55.0981 12.8159 54.6758 13.292 54.124 13.6338C53.5771 13.9756 52.9473 14.1465 52.2344 14.1465C51.1602 14.1465 50.2886 13.7729 49.6196 13.0259C48.9556 12.2788 48.6235 11.29 48.6235 10.0596V9.96436ZM49.9858 10.1255C49.9858 11.0044 50.1885 11.71 50.5938 12.2422C51.0039 12.7744 51.5508 13.0405 52.2344 13.0405C52.9229 13.0405 53.4697 12.772 53.875 12.2349C54.2803 11.6929 54.4829 10.936 54.4829 9.96436C54.4829 9.09521 54.2754 8.39209 53.8604 7.85498C53.4502 7.31299 52.9033 7.04199 52.2197 7.04199C51.5508 7.04199 51.0112 7.30811 50.6011 7.84033C50.1909 8.37256 49.9858 9.13428 49.9858 10.1255ZM65.8721 11.8979C65.8721 11.5317 65.7329 11.2485 65.4546 11.0483C65.1812 10.8433 64.7002 10.6675 64.0117 10.521C63.3281 10.3745 62.7837 10.1987 62.3784 9.99365C61.978 9.78857 61.6802 9.54443 61.4849 9.26123C61.2944 8.97803 61.1992 8.64111 61.1992 8.25049C61.1992 7.60107 61.4727 7.05176 62.0195 6.60254C62.5713 6.15332 63.2744 5.92871 64.1289 5.92871C65.0273 5.92871 65.7549 6.16064 66.3115 6.62451C66.873 7.08838 67.1538 7.68164 67.1538 8.4043H65.7915C65.7915 8.0332 65.6328 7.71338 65.3154 7.44482C65.0029 7.17627 64.6074 7.04199 64.1289 7.04199C63.6357 7.04199 63.25 7.14941 62.9717 7.36426C62.6934 7.5791 62.5542 7.85986 62.5542 8.20654C62.5542 8.53369 62.6836 8.78027 62.9424 8.94629C63.2012 9.1123 63.6675 9.271 64.3413 9.42236C65.02 9.57373 65.5693 9.75439 65.9893 9.96436C66.4092 10.1743 66.7192 10.4282 66.9194 10.7261C67.1245 11.019 67.2271 11.3779 67.2271 11.8027C67.2271 12.5107 66.9438 13.0796 66.3774 13.5093C65.811 13.9341 65.0762 14.1465 64.1729 14.1465C63.5381 14.1465 62.9766 14.0342 62.4883 13.8096C62 13.585 61.6167 13.2725 61.3384 12.8721C61.0649 12.4668 60.9282 12.0298 60.9282 11.561H62.2832C62.3076 12.0151 62.4883 12.3765 62.8252 12.645C63.167 12.9087 63.6162 13.0405 64.1729 13.0405C64.6855 13.0405 65.0957 12.938 65.4033 12.7329C65.7158 12.5229 65.8721 12.2446 65.8721 11.8979ZM72.2808 14.1465C71.2065 14.1465 70.3325 13.7949 69.6587 13.0918C68.9849 12.3838 68.6479 11.439 68.6479 10.2573V10.0083C68.6479 9.22217 68.7969 8.52148 69.0947 7.90625C69.3975 7.28613 69.8174 6.80273 70.3545 6.45605C70.8965 6.10449 71.4824 5.92871 72.1123 5.92871C73.1426 5.92871 73.9434 6.26807 74.5146 6.94678C75.0859 7.62549 75.3716 8.59717 75.3716 9.86182V10.4258H70.0029C70.0225 11.207 70.2495 11.8394 70.6841 12.3228C71.1235 12.8013 71.6802 13.0405 72.354 13.0405C72.8325 13.0405 73.2378 12.9429 73.5698 12.7476C73.9019 12.5522 74.1924 12.2935 74.4414 11.9712L75.269 12.6157C74.605 13.6362 73.6089 14.1465 72.2808 14.1465ZM72.1123 7.04199C71.5654 7.04199 71.1064 7.24219 70.7354 7.64258C70.3643 8.03809 70.1348 8.59473 70.0469 9.3125H74.0166V9.20996C73.9775 8.52148 73.792 7.98926 73.46 7.61328C73.1279 7.23242 72.6787 7.04199 72.1123 7.04199ZM76.624 9.97168C76.624 8.73633 76.9097 7.75488 77.481 7.02734C78.0522 6.29492 78.8091 5.92871 79.7515 5.92871C80.7183 5.92871 81.4727 6.27051 82.0146 6.9541L82.0806 6.0752H83.3184V13.8096C83.3184 14.835 83.0132 15.6431 82.4028 16.2339C81.7974 16.8247 80.9819 17.1201 79.9565 17.1201C79.3853 17.1201 78.8262 16.998 78.2793 16.7539C77.7324 16.5098 77.3149 16.1753 77.0269 15.7505L77.73 14.9375C78.311 15.6553 79.0215 16.0142 79.8613 16.0142C80.5205 16.0142 81.0332 15.8286 81.3994 15.4575C81.7705 15.0864 81.9561 14.564 81.9561 13.8901V13.209C81.4141 13.834 80.6743 14.1465 79.7368 14.1465C78.8091 14.1465 78.0571 13.7729 77.481 13.0259C76.9097 12.2788 76.624 11.2607 76.624 9.97168ZM77.9863 10.1255C77.9863 11.019 78.1694 11.7222 78.5356 12.2349C78.9019 12.7427 79.4146 12.9966 80.0737 12.9966C80.9282 12.9966 81.5557 12.6084 81.9561 11.832V8.21387C81.541 7.45703 80.9185 7.07861 80.0884 7.07861C79.4292 7.07861 78.9141 7.33496 78.543 7.84766C78.1719 8.36035 77.9863 9.11963 77.9863 10.1255ZM90.2617 13.2163C89.7344 13.8364 88.9604 14.1465 87.9399 14.1465C87.0952 14.1465 86.4507 13.9023 86.0063 13.4141C85.5669 12.9209 85.3447 12.1934 85.3398 11.2314V6.0752H86.6948V11.1948C86.6948 12.396 87.1831 12.9966 88.1597 12.9966C89.1948 12.9966 89.8833 12.6108 90.2251 11.8394V6.0752H91.5801V14H90.291L90.2617 13.2163ZM97.4761 7.29102C97.271 7.25684 97.0488 7.23975 96.8096 7.23975C95.9209 7.23975 95.3179 7.61816 95.0005 8.375V14H93.6455V6.0752H94.9639L94.9858 6.99072C95.4302 6.28271 96.0601 5.92871 96.8755 5.92871C97.1392 5.92871 97.3394 5.96289 97.4761 6.03125V7.29102ZM98.2231 9.96436C98.2231 9.18799 98.3745 8.48975 98.6772 7.86963C98.9849 7.24951 99.4097 6.771 99.9517 6.43408C100.499 6.09717 101.121 5.92871 101.819 5.92871C102.898 5.92871 103.77 6.30225 104.434 7.04932C105.103 7.79639 105.438 8.79004 105.438 10.0303V10.1255C105.438 10.897 105.289 11.5903 104.991 12.2056C104.698 12.8159 104.275 13.292 103.724 13.6338C103.177 13.9756 102.547 14.1465 101.834 14.1465C100.76 14.1465 99.8882 13.7729 99.2192 13.0259C98.5552 12.2788 98.2231 11.29 98.2231 10.0596V9.96436ZM99.5854 10.1255C99.5854 11.0044 99.7881 11.71 100.193 12.2422C100.604 12.7744 101.15 13.0405 101.834 13.0405C102.522 13.0405 103.069 12.772 103.475 12.2349C103.88 11.6929 104.083 10.936 104.083 9.96436C104.083 9.09521 103.875 8.39209 103.46 7.85498C103.05 7.31299 102.503 7.04199 101.819 7.04199C101.15 7.04199 100.611 7.30811 100.201 7.84033C99.7905 8.37256 99.5854 9.13428 99.5854 10.1255ZM117.552 10.1255C117.552 11.3315 117.276 12.3032 116.724 13.0405C116.172 13.7778 115.425 14.1465 114.483 14.1465C113.521 14.1465 112.764 13.8413 112.212 13.231V17.0469H110.857V6.0752H112.095L112.161 6.9541C112.713 6.27051 113.479 5.92871 114.461 5.92871C115.413 5.92871 116.165 6.2876 116.717 7.00537C117.273 7.72314 117.552 8.72168 117.552 10.001V10.1255ZM116.197 9.97168C116.197 9.07812 116.006 8.37256 115.625 7.85498C115.245 7.3374 114.722 7.07861 114.058 7.07861C113.238 7.07861 112.623 7.44238 112.212 8.16992V11.9565C112.618 12.6792 113.238 13.0405 114.073 13.0405C114.722 13.0405 115.237 12.7842 115.618 12.2715C116.004 11.7539 116.197 10.9873 116.197 9.97168ZM118.921 9.96436C118.921 9.18799 119.073 8.48975 119.375 7.86963C119.683 7.24951 120.108 6.771 120.65 6.43408C121.197 6.09717 121.819 5.92871 122.518 5.92871C123.597 5.92871 124.468 6.30225 125.132 7.04932C125.801 7.79639 126.136 8.79004 126.136 10.0303V10.1255C126.136 10.897 125.987 11.5903 125.689 12.2056C125.396 12.8159 124.974 13.292 124.422 13.6338C123.875 13.9756 123.245 14.1465 122.532 14.1465C121.458 14.1465 120.586 13.7729 119.917 13.0259C119.253 12.2788 118.921 11.29 118.921 10.0596V9.96436ZM120.284 10.1255C120.284 11.0044 120.486 11.71 120.892 12.2422C121.302 12.7744 121.849 13.0405 122.532 13.0405C123.221 13.0405 123.768 12.772 124.173 12.2349C124.578 11.6929 124.781 10.936 124.781 9.96436C124.781 9.09521 124.573 8.39209 124.158 7.85498C123.748 7.31299 123.201 7.04199 122.518 7.04199C121.849 7.04199 121.309 7.30811 120.899 7.84033C120.489 8.37256 120.284 9.13428 120.284 10.1255ZM131.666 7.29102C131.46 7.25684 131.238 7.23975 130.999 7.23975C130.11 7.23975 129.507 7.61816 129.19 8.375V14H127.835V6.0752H129.153L129.175 6.99072C129.62 6.28271 130.25 5.92871 131.065 5.92871C131.329 5.92871 131.529 5.96289 131.666 6.03125V7.29102Z"
                ),
                t.appendChild(r);
              var n = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              n.setAttribute("fill", "#2ECC71"),
                n.setAttribute(
                  "d",
                  "M12.0833 7.33337H11.6666V5.66671C11.6666 3.82837 10.1716 2.33337 8.33325 2.33337C6.49492 2.33337 4.99992 3.82837 4.99992 5.66671V7.33337H4.58325C3.89436 7.33337 3.33325 7.89393 3.33325 8.58337V14.4167C3.33325 15.1062 3.89436 15.6667 4.58325 15.6667H12.0833C12.7721 15.6667 13.3333 15.1062 13.3333 14.4167V8.58337C13.3333 7.89393 12.7721 7.33337 12.0833 7.33337ZM6.11103 5.66671C6.11103 4.44115 7.1077 3.44449 8.33325 3.44449C9.55881 3.44449 10.5555 4.44115 10.5555 5.66671V7.33337H6.11103V5.66671Z"
                ),
                t.appendChild(n);
              var i = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              i.setAttribute("fill", "#FF6720"),
                i.setAttribute(
                  "d",
                  "M147.139 12.0616C147.121 12.1471 147.104 12.2334 147.087 12.3188C146.651 12.3921 146.214 12.4409 145.776 12.4679C146.241 12.3415 146.695 12.2081 147.139 12.0616Z"
                ),
                t.appendChild(i);
              var a = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              a.setAttribute("fill", "#FF6720"),
                a.setAttribute(
                  "d",
                  "M156.881 3.66162C155.634 7.12272 153.067 10.2473 149.604 11.6204C149.604 11.6204 149.743 10.9343 149.743 10.9343C152.555 9.31795 154.474 6.42353 155.249 3.31812C155.523 3.16817 156.271 2.74011 156.271 2.74011C156.271 2.74011 156.666 3.32771 156.881 3.66162Z"
                ),
                t.appendChild(a);
              var s = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              s.setAttribute("fill", "white"),
                s.setAttribute(
                  "d",
                  "M150.981 4.85079C151.006 4.72525 151.045 4.64679 151.187 4.63633C151.794 4.58838 152.4 4.48986 153.005 4.49509C153.753 4.50032 154.247 5.02952 154.345 5.83158C154.73 5.02516 155.032 4.18211 155.249 3.31815C155.239 3.3103 155.228 3.30332 155.218 3.29635C154.62 2.88747 153.938 2.77762 153.237 2.74798C151.805 2.68521 150.418 2.96419 149.048 3.34343C148.975 3.36435 148.891 3.47594 148.874 3.55877C148.753 4.14986 146.611 14.6709 146.611 14.6709H148.214C148.665 14.6709 149.052 14.3222 149.143 13.8741C149.144 13.8758 150.877 5.36778 150.981 4.85079Z"
                ),
                t.appendChild(s);
              var o = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              o.setAttribute("fill", "white"),
                o.setAttribute(
                  "d",
                  "M156.41 4.81763C155.133 7.60656 152.99 10.0572 150.208 11.3597C154.714 12.6509 157.68 8.20375 156.41 4.81763Z"
                ),
                t.appendChild(o);
              var c = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              c.setAttribute("fill", "white"),
                c.setAttribute(
                  "d",
                  "M146.053 7.03646C142.78 3.86567 137.201 7.48457 138.096 11.7966C138.652 14.4791 141.547 15.0746 143.89 14.4416C145.377 14.0406 145.2 12.5943 145.2 12.5943C143.335 13.0267 139.786 12.6379 140.077 11.209C141.512 11.6126 143.698 11.7085 145.233 10.9178C147.235 9.88554 146.893 7.98324 146.053 7.03646ZM144.681 8.84373C144.181 9.87857 141.324 9.86985 140.295 9.56733C140.941 8.0992 142.637 7.22215 144.192 7.8577C144.662 8.05037 144.87 8.44792 144.681 8.84373Z"
                ),
                t.appendChild(c);
              var u = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              u.setAttribute("fill", "white"),
                u.setAttribute(
                  "d",
                  "M166.438 6.49759C165.052 6.04163 163.39 5.8324 162.172 5.8324C158.951 5.8324 156.924 8.7399 157.019 11.2908C157.055 12.2699 157.383 14.4921 160.333 14.7476C161.152 14.8182 161.933 14.7127 162.618 14.2053C162.623 14.2009 162.671 14.1582 162.659 14.2192C162.635 14.3613 162.58 14.6735 162.58 14.6735C162.58 14.6735 164.118 14.6735 164.848 14.6735C164.985 14.6735 165.004 14.5784 165.024 14.4817C165.548 11.9098 166.076 9.34319 166.594 6.7696C166.627 6.60744 166.595 6.54816 166.438 6.49759ZM163.938 8.03024C163.662 9.35627 163.394 10.684 163.115 12.0109C163.091 12.1251 163.031 12.2289 162.944 12.3065C162.282 12.8976 161.51 13.092 160.648 12.8932C158.994 12.5122 159.265 10.161 159.844 9.02672C160.372 7.99449 161.565 7.41125 162.779 7.56905C163.995 7.72598 163.97 7.87593 163.938 8.03024Z"
                ),
                t.appendChild(u);
              var l = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              l.setAttribute("fill", "white"),
                l.setAttribute(
                  "d",
                  "M192.993 8.93518C192.824 6.9056 191.226 5.8324 189.308 5.8324C185.286 5.8324 183.958 9.20196 184.08 11.5436C184.198 13.7921 186.181 14.8391 188.179 14.6517C190.035 14.5409 191.429 13.6909 192.292 12.0258C192.791 11.0607 193.114 10.0433 192.993 8.93518ZM187.447 12.7485C185.676 12.3832 186.276 10.0354 186.646 9.34319C187.538 7.67105 188.753 7.59433 189.444 7.70418C190.357 7.84803 190.876 8.50189 190.824 9.60648C190.747 11.2786 189.506 13.1731 187.447 12.7485Z"
                ),
                t.appendChild(l);
              var _ = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              _.setAttribute("fill", "white"),
                _.setAttribute(
                  "d",
                  "M166.099 18.4589L166.399 16.9838C166.444 16.8112 166.606 16.6882 166.785 16.683C167.684 16.6577 167.991 16.5008 168.441 16.0108C168.784 15.5732 169.044 15.2218 169.333 14.8173C169.371 14.7641 169.375 14.6691 169.361 14.5994C168.874 12.1208 167.645 5.83242 167.645 5.83242C167.645 5.83242 169.885 5.81236 170.026 6.71382C170.296 8.44001 170.936 11.9299 170.966 12.0676C171.046 11.9308 173.14 8.32493 174.12 6.59612C174.601 5.74785 176.432 5.83242 177.038 5.83242C175.232 8.85848 171.725 14.7267 171.178 15.6386C169.757 18.0047 168.507 18.4772 167.198 18.4606C166.841 18.4563 166.099 18.4589 166.099 18.4589Z"
                ),
                t.appendChild(_);
              var p = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              return (
                p.setAttribute("fill", "white"),
                p.setAttribute(
                  "d",
                  "M182.692 12.2351C182.566 12.8567 182.335 13.9875 182.327 14.0276C182.314 14.0938 182.286 14.167 182.199 14.2002C180.989 14.6535 179.698 14.8671 178.524 14.4495C174.723 13.0999 175.743 6.97546 179.713 6.00077C181.662 5.52214 183.606 6.21524 183.701 6.24488C183.811 6.27975 183.88 6.39134 183.858 6.50468C183.789 6.84556 183.571 7.92486 183.561 7.96409C182.461 7.60752 181.306 7.34946 180.182 7.74527C177.95 8.53339 177.465 12.3746 179.685 12.8245C180.749 13.0407 181.723 12.6623 182.692 12.2351Z"
                ),
                t.appendChild(p),
                e.appendChild(t),
                e
              );
            },
            generateContainer: function () {
              var e = document.createElement("div");
              return (
                (e.id = "ard3"),
                (e.style.boxShadow = "0 1px 10px #0000004d"),
                (e.style.borderRadius = "5px"),
                (e.style.backgroundColor = "rgba(255,255,255,1)"),
                (e.style.width = "400px"),
                (e.style.height = "340px"),
                e
              );
            },
            generateSpinnerBox: function () {
              var e = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
              );
              e.setAttribute("viewBox", "0 0 448 512"),
                e.setAttribute("width", "20"),
                e.setAttribute("height", "26"),
                e.setAttribute("fill", "none");
              var t = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              t.setAttribute("fill", "#808080"),
                t.setAttribute(
                  "d",
                  "M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"
                ),
                e.appendChild(t),
                (e.style.cssText =
                  "position:absolute;left:50%;top:50%;transform: translate(-50%, -50%);");
              var r = document.createElement("div");
              r.classList.add("l034d");
              var n = document.createElement("div");
              return (
                (n.id = "spX43"),
                (n.style.cssText =
                  "position:relative;transition: visibility 0.5s, opacity 0.5s linear;"),
                n.appendChild(r),
                n.appendChild(e),
                n
              );
            },
            generateOverlay: function (e) {
              var t =
                  "display:-ms-flexbox;display:-webkit-flex;display:flex;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center",
                r = document.createElement("div");
              (r.id = "fb4xtw"), (r.style.cssText = t);
              var n = this.generateContainer(),
                i = this.generateSpinnerBox(),
                a = this.generateEpaycoLogo(),
                s = document.createElement("div");
              (s.id = "oKvf3"),
                (s.style.cssText = t),
                (s.style.width = "100%"),
                (s.style.height = "100%"),
                (s.style.position = "fixed"),
                (s.style.backgroundColor = "rgba(0,0,0,0.7)"),
                (s.style.zIndex = "99999"),
                (s.style.top = "0"),
                (s.style.left = "0"),
                n.appendChild(i),
                r.appendChild(n),
                r.appendChild(a),
                s.appendChild(r),
                document.body.appendChild(s);
            },
          }),
          (r.exports = helpers);
      }).call(this);
    },
  }),
  EpaycoCheckout.require.define({
    "outer/controllers/iframe": function (e, t, r) {
      (function () {
        (helpers = t("lib/helpers")),
          (insertAfter = (_ref = t("outer/lib/utils")).insertAfter),
          (append = _ref.append);
        var e = function () {
            window.addEventListener
              ? window.addEventListener(
                  "message",
                  function (e) {
                    n(e);
                  },
                  !1
                )
              : window.attachEvent &&
                window.attachEvent("onmessage", function (e) {
                  n(e);
                });
          },
          n = function (e) {
            var t = helpers.isSession();
            if ("onLoadOnPage" === e.data.event) {
              if (document.getElementById("fb4xtw")) {
                document.getElementById("fb4xtw").remove();
                var r = document.getElementById("checkout-epayco");
                r.contentWindow.postMessage(t, "*"),
                  (r.style.display = "block"),
                  window.postMessage(
                    { event: "onLoadCheckout", response: e.data.response },
                    "*"
                  );
              }
            } else
              "handleCloseModal" === e.data.event &&
                (i(),
                window.postMessage(
                  { event: "onCloseModal", response: { closed: !0 } },
                  "*"
                ));
          },
          i = function () {
            let e = document.getElementsByClassName("epayco-button-render");
            for (let t = 0; t < e.length; t++)
              e[t].setAttribute(
                "style",
                "padding: 0; background: none; border: none; cursor: pointer;"
              );
            "remove" in Element.prototype ||
              (Element.prototype.remove = function () {
                this.parentNode && this.parentNode.removeChild(this);
              }),
              document.getElementById("oKvf3") &&
                document.getElementById("oKvf3").remove();
          },
          a = function (t, r, n) {
            var i = r ? t : t.dataset;
            return (
              i &&
                (helpers.generateOverlay(document.body),
                helpers.generateUrlOnePageCheckout(i, function (t) {
                  new (function (r) {
                    var n, i;
                    return (
                      (this.$el = document.createElement("iframe")),
                      (this.$el.closed =
                        ((n = this.closed),
                        (i = this),
                        function () {
                          return n.apply(i, arguments);
                        })),
                      this.$el.setAttribute("frameBorder", "0"),
                      this.$el.setAttribute("name", "onePage"),
                      this.$el.setAttribute("allowtransparency", "true"),
                      (this.$el.scrolling = "no"),
                      this.$el.setAttribute("id", "checkout-epayco"),
                      (this.$el.style.width = "100%"),
                      (this.$el.style.height = "100%"),
                      (this.$el.style.display = "none"),
                      (this.$el.src = t),
                      e(),
                      append(document.getElementById("oKvf3"), this.$el)
                    );
                  })(i);
                })),
              a
            );
          };
        r.exports = a;
      }).call(this);
    },
  }),
  EpaycoCheckout.require.define({
    "outer/controllers/render": function (e, t, r) {
      (function () {
        let e = t("lib/helpers");
        r.exports = {
          load: function (t, r) {
            (t.epaycoImplementationType = "handler"),
              e.onlineCheckout(null, t, r);
          },
        };
      }).call(this);
    },
  }),
  function () {
    var e = e || this.EpaycoCheckout.require;
    (Button = e("outer/controllers/button")),
      (helpers = e("lib/helpers")),
      Button.load(this.EpaycoCheckout.__app);
  }.call(this),
  function () {
    var e, t, r, n;
    window.ePayco || (window.ePayco = {}),
      (ePayco.checkout = {}),
      (ePayco.checkout.configure = function (i) {
        if (void 0 === i.key || void 0 === i.test) {
          if (void 0 !== i.sessionId && "" !== i.sessionId)
            (r = i.sessionId), (n = !!i.external);
          else throw "Los parametros key o test son indefinidos o nulos";
        }
        return (e = i.key), (t = i.test), this;
      }),
      (ePayco.checkout.open = function (r, n) {
        n = helpers.isEmptyObject(n) ? {} : n;
        var i = function (e) {
            for (var t, r = e.split("_"), n = "", i = 0; i < r.length; i += 1)
              n += (t = r[i]).charAt(0).toUpperCase() + t.slice(1);
            return "epayco" + n;
          },
          a = {};
        for (var s in r)
          r.hasOwnProperty(s) &&
            ((a[i(s).trim()] = r[s]),
            ["confirmation", "response"].includes(s) &&
              (a[i(s).trim()] = r[s]));
        window.addEventListener(
          "message",
          function (e) {
            "onTokenReceived" ===
              (e = "object" == typeof e ? e : {}).data.event &&
              ePayco.checkout.onTokenReceived(e.data.token);
          },
          !1
        ),
          (a.epaycoConfig = JSON.stringify(n)),
          (a.epaycoKey = e),
          (a.epaycoTest = "true" === String(t) ? "true" : "false");
        var o = o || EpaycoCheckout.require;
        return (
          (Render = o("outer/controllers/render")).load(
            a,
            helpers.initParams(n)
          ),
          this
        );
      }),
      (ePayco.checkout.openNew = function () {
        var e = e || EpaycoCheckout.require;
        return (
          (Render = e("outer/controllers/render")).load(
            { epaycoSessionId: r, epaycoExternal: n },
            helpers.initParams({})
          ),
          this
        );
      }),
      (ePayco.checkout.onCreated = function (e) {
        return (
          window.addEventListener(
            "message",
            function (t) {
              "object" == typeof t &&
                "onLoadCheckout" === t.data.event &&
                e(t.data.response);
            },
            !1
          ),
          this
        );
      }),
      (ePayco.checkout.onLoadTransactionId = function (e) {
        return (
          window.addEventListener(
            "message",
            function (t) {
              "object" == typeof t &&
                "onLoadTransactionId" === t.data.event &&
                e();
            },
            !1
          ),
          this
        );
      }),
      (ePayco.checkout.onCreatedTransactionId = function (e) {
        return (
          window.addEventListener(
            "message",
            function (t) {
              "object" == typeof t &&
                "onCreatedTransactionId" === t.data.event &&
                e();
            },
            !1
          ),
          this
        );
      }),
      (ePayco.checkout.onErrors = function () {}),
      (ePayco.checkout.onResponse = function (e) {
        return (
          window.addEventListener(
            "message",
            function (t) {
              "object" == typeof t &&
                "onResponse" === t.data.event &&
                e(t.data.response);
            },
            !1
          ),
          this
        );
      }),
      (ePayco.checkout.onClosed = function (e) {
        return (
          window.addEventListener(
            "message",
            function (t) {
              "object" == typeof t &&
                "onCloseModal" === t.data.event &&
                e(t.data.response);
            },
            !1
          ),
          this
        );
      });
  }.call(this),
  function () {
    var e = e || this.EpaycoCheckout.require;
    (Button = e("outer/controllers/button")), (helpers = e("lib/helpers"));
    let t = (e = "") => {
        let t = e.split("_"),
          n = "";
        for (var i = 0; i < t.length; i += 1) n += r(t[i]);
        return "epayco" + n;
      },
      r = (e = "") => e.charAt(0).toUpperCase() + e.slice(1);
    window.onload = (function () {
      for (var e in window)
        if (
          !/webkitStorageInfo|webkitIndexedDB|onmozfullscreenerror|onmozfullscreenchange/.test(
            e
          ) &&
          window[e]
        ) {
          var r = window[e],
            n = e;
          if (
            "object" == typeof r &&
            null !== r &&
            "data" === e &&
            r.hasOwnProperty("name") &&
            r.hasOwnProperty("amount") &&
            r.hasOwnProperty("description") &&
            r.hasOwnProperty("currency") &&
            void 0 === r.window
          ) {
            let i = {};
            Object.keys(r).map((e) => {
              let n = t(e).trim();
              i[n] = r[e];
            }),
              (r.signature = helpers.parseParamsForScript(i)),
              (window[n] = r);
          }
        }
    })();
  }.call(this);
