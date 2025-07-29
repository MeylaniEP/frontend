'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FaChartLine,
  FaMagic,
  FaCheckCircle,
  FaSpinner,
  FaSyncAlt,
  FaCalculator,
  FaChartBar,
  FaExclamationTriangle,
  FaFlask, // Icon baru untuk eksperimen
} from 'react-icons/fa';

export default function HomePage() {
  const [aspdNumerasi, setAspdNumerasi] = useState('');
  const [aspdSains, setAspdSains] = useState('');
  const [bahasaIndonesia1, setBahasaIndonesia1] = useState('');
  const [aspdLiterasi, setAspdLiterasi] = useState('');
  const [rataRataLiterasi1, setRataRataLiterasi1] = useState('');
  const [bahasaIndonesia2, setBahasaIndonesia2] = useState('');
  const [nilaiAktual, setNilaiAktual] = useState('');

  // State baru untuk menyimpan hasil dari masing-masing model
  const [rfKe5Results, setRfKe5Results] = useState(null);
  const [dtKe5Results, setDtKe5Results] = useState(null);
  const [rfBaselineResults, setRfBaselineResults] = useState(null); // Changed state name
  const [dtBaselineResults, setDtBaselineResults] = useState(null); // Changed state name

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateErrorPercentage = useMemo(() => (predicted, actual) => {
    if (predicted === undefined || actual === null || isNaN(actual) || actual === 0) {
      return null;
    }
    return Math.abs(((predicted - actual) / actual) * 100);
  }, []);

  const handlePredictAll = async () => {
    setLoading(true);
    setError(null);
    setRfKe5Results(null);
    setDtKe5Results(null);
    setRfBaselineResults(null); // Changed state name
    setDtBaselineResults(null); // Changed state name

    try {
      const inputData = {
        aspd_numerasi: parseFloat(aspdNumerasi),
        aspd_sains: parseFloat(aspdSains),
        bahasa_indonesia1: parseFloat(bahasaIndonesia1),
        bahasa_indonesia2: parseFloat(bahasaIndonesia2),
        aspd_literasi: parseFloat(aspdLiterasi),
        rata_rata_literasi1: parseFloat(rataRataLiterasi1),
        nilai_aktual: nilaiAktual ? parseFloat(nilaiAktual) : null,
      };

      for (const key in inputData) {
        if (key === 'nilai_aktual') {
          if (nilaiAktual !== '' && isNaN(inputData[key])) {
            throw new Error(`Input 'Nilai Aktual' tidak valid. Harap masukkan angka.`);
          }
          continue;
        }
        if (isNaN(inputData[key])) {
          throw new Error(`Input '${key.replace(/_/g, ' ')}' tidak valid. Harap masukkan angka.`);
        }
      }

      const response = await fetch(`http://202.74.75.108:8000/predict_all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Terjadi kesalahan tidak dikenal saat melakukan prediksi.';

        if (errorData && errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(err => {
              if (err.type === 'value_error.missing' && err.loc && err.loc.length > 1) {
                return `Field '${err.loc[1].replace(/_/g, ' ')}' dibutuhkan`;
              }
              return err.msg || 'Kesalahan validasi';
            }).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } else if (errorData && errorData.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = response.statusText || `Kode Status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Set results for both ke5 and baseline models
      setRfKe5Results(data.rf_ke5_results);
      setDtKe5Results(data.dt_ke5_results);
      setRfBaselineResults(data.rf_baseline_results); // Changed key
      setDtBaselineResults(data.dt_baseline_results); // Changed key

    } catch (err) {
      setError(err.message || 'Terjadi kesalahan jaringan atau client-side.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setAspdNumerasi('');
    setAspdSains('');
    setBahasaIndonesia1('');
    setAspdLiterasi('');
    setRataRataLiterasi1('');
    setBahasaIndonesia2('');
    setNilaiAktual('');
    setRfKe5Results(null);
    setDtKe5Results(null);
    setRfBaselineResults(null); // Changed state name
    setDtBaselineResults(null); // Changed state name
    setError(null);
    setLoading(false);
  };

  const renderMetrics = (metrics) => {
    if (!metrics) return <p style={{ color: '#aaaaaa', fontSize: '0.95em' }}>Metrik evaluasi tidak tersedia.</p>;

    const metricItems = [
      { label: 'MAE', value: metrics.mae, icon: <FaCalculator /> },
      { label: 'MSE', value: metrics.mse, icon: <FaChartBar /> },
      { label: 'RMSE', value: metrics.rmse, icon: <FaChartLine /> },
      { label: 'R2 Score', value: metrics.r2, icon: <FaCheckCircle /> },
    ];

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '10px',
        marginTop: '15px',
      }}>
        {metricItems.map((item, index) => (
          <div key={index} style={{
            backgroundColor: '#252525',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #3a3a3a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
          }}>
            <div style={{ color: '#ff8c00', fontSize: '1.5em', marginBottom: '6px' }}>
              {item.icon}
            </div>
            <h5 style={{ color: '#bbbbbb', marginBottom: '3px', fontSize: '0.9em', fontWeight: 'normal', textAlign: 'center' }}>
              {item.label}
            </h5>
            <p style={{
              color: '#00e676',
              fontWeight: 'bold',
              fontSize: '1.2em',
              wordBreak: 'break-all',
            }}>
              {item.value !== undefined && item.value !== null ? item.value.toFixed(4) : 'N/A'}
            </p>
          </div>
        ))}
      </div>
    );
  };


  return (
    <div style={{
      fontFamily: 'Roboto, sans-serif',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #0f0f0f, #1a1a1a)',
      color: '#e0e0e0',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        borderRadius: '15px',
        boxShadow: '0 15px 50px rgba(0, 0, 0, 0.6)',
        padding: '30px',
        maxWidth: '1100px',
        width: '100%',
        border: '1px solid #333333',
        display: 'flex',
        gap: '30px',
        flexWrap: 'wrap',
        overflow: 'hidden',
      }}>
        {/* Kolom Kiri: Input Form dan Kontrol */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <h1 style={{
            textAlign: 'center',
            color: '#00e676',
            marginBottom: '30px',
            fontSize: '2.5em',
            fontWeight: 'bold',
            textShadow: '0 0 15px rgba(0, 230, 118, 0.6)',
            letterSpacing: '1.5px',
          }}>
            Input Data Prediksi
          </h1>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { id: 'bahasaIndonesia1', label: 'Bahasa Indonesia 1', state: bahasaIndonesia1, setState: setBahasaIndonesia1 },
              { id: 'bahasaIndonesia2', label: 'Bahasa Indonesia 2', state: bahasaIndonesia2, setState: setBahasaIndonesia2 },
              { id: 'aspdNumerasi', label: 'ASPD Numerasi', state: aspdNumerasi, setState: setAspdNumerasi },
              { id: 'aspdLiterasi', label: 'ASPD Literasi', state: aspdLiterasi, setState: setAspdLiterasi },
              { id: 'aspdSains', label: 'ASPD Sains', state: aspdSains, setState: setAspdSains },
              { id: 'rataRataLiterasi1', label: 'Rata-rata Literasi 1', state: rataRataLiterasi1, setState: setRataRataLiterasi1 },
              { id: 'nilaiAktual', label: 'Nilai Aktual (Opsional)', state: nilaiAktual, setState: setNilaiAktual, optional: true }
            ].map((field) => (
              <div key={field.id} style={{ position: 'relative' }}>
                <label htmlFor={field.id} style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#cccccc',
                  fontSize: '1.1em',
                }}>
                  {field.label}:
                </label>
                <input
                  type="number"
                  id={field.id}
                  value={field.state}
                  onChange={(e) => field.setState(e.target.value)}
                  required={!field.optional}
                  placeholder={field.optional ? 'Masukkan nilai aktual (jika ada)' : 'Masukkan nilai'}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    border: '1px solid #4a4a4a',
                    borderRadius: '10px',
                    boxSizing: 'border-box',
                    fontSize: '1em',
                    color: '#f0f0f0',
                    backgroundColor: '#282828',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#00e676';
                    e.target.style.boxShadow = '0 0 0 4px rgba(0, 230, 118, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#4a4a4a';
                    e.target.style.boxShadow = 'none';
                  }}
                  suppressHydrationWarning
                />
              </div>
            ))}

            {/* Tombol Prediksi dan Clear */}
            <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
              <button
                type="button"
                onClick={handlePredictAll}
                disabled={loading}
                style={{
                  flex: 1.5,
                  padding: '16px 25px',
                  backgroundColor: '#00c853',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '1.2em',
                  fontWeight: 'bold',
                  transition: 'background-color 0.3s ease, transform 0.1s ease, box-shadow 0.3s ease',
                  boxShadow: '0 8px 25px rgba(0, 200, 83, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  outline: 'none',
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#00a944')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#00c853')}
                onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
                suppressHydrationWarning
              >
                {loading ? (
                  <>
                    <FaSpinner className="spin" style={{ fontSize: '1.4em' }} /> Memproses...
                    <style jsx>{`
                      .spin {
                        animation: spin 1s linear infinite;
                      }
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
                  </>
                ) : (
                  <>
                    <FaChartLine style={{ fontSize: '1.4em' }} /> Prediksi Sekarang
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  flex: 1,
                  padding: '16px 25px',
                  backgroundColor: '#ff3d00',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '1.2em',
                  fontWeight: 'bold',
                  transition: 'background-color 0.3s ease, transform 0.1s ease, box-shadow 0.3s ease',
                  boxShadow: '0 8px 25px rgba(255, 61, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  outline: 'none',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc3300'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff3d00'}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                suppressHydrationWarning
              >
                <FaSyncAlt style={{ fontSize: '1.2em' }} /> Reset
              </button>
            </div>
          </form>

          {/* Bagian Error */}
          {error && (
            <div style={{
              backgroundColor: '#ff4d4d',
              color: '#fff',
              padding: '15px 20px',
              borderRadius: '10px',
              marginTop: '25px',
              fontWeight: 'bold',
              fontSize: '1em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 5px 15px rgba(255, 77, 77, 0.3)',
              border: '1px solid #e60000',
            }}>
              <FaExclamationTriangle style={{ fontSize: '1.5em' }} /> Error: {error}
            </div>
          )}


        </div>

        {/* Kolom Kanan: Hasil Prediksi */}
        <div style={{ flex: 1.5, minWidth: '380px' }}>
          <h2 style={{
            textAlign: 'center',
            color: '#82b1ff',
            marginBottom: '30px',
            fontSize: '2.2em',
            fontWeight: 'bold',
            textShadow: '0 0 15px rgba(130, 177, 255, 0.6)',
            letterSpacing: '1.2px',
          }}>
            Hasil Prediksi & Evaluasi
          </h2>

          {!rfKe5Results && !dtKe5Results && !rfBaselineResults && !dtBaselineResults && !loading && !error && (
            <div style={{
              backgroundColor: '#2b2b2b',
              padding: '30px',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#aaaaaa',
              fontSize: '1.1em',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
              border: '1px dashed #4a4a4a',
            }}>
              <FaMagic style={{ fontSize: '3em', color: '#82b1ff' }} />
              <p>Masukkan data di sebelah kiri dan klik Prediksi Sekarang untuk melihat hasil dan metrik evaluasi model.</p>
            </div>
          )}

          {loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#2b2b2b',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
              color: '#00e676',
              border: '1px solid #4a4a4a',
            }}>
              <FaSpinner className="spin" style={{ fontSize: '3em', marginBottom: '20px' }} />
              <p style={{ fontSize: '1.3em', fontWeight: 'bold' }}>Memuat hasil prediksi...</p>
            </div>
          )}

          {(rfKe5Results || dtKe5Results || rfBaselineResults || dtBaselineResults) && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '25px',
            }}>
              {/* Eksperimen 1 Results */}
              <h3 style={{
                color: '#e0e0e0', // Warna yang lebih netral
                marginBottom: '10px',
                fontSize: '1.8em',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '2px solid #555', // Garis pemisah
                paddingBottom: '10px',
              }}>
                <FaFlask style={{ fontSize: '1.3em', color: '#82b1ff' }} /> Hasil Hyper Parameter Tuning
              </h3>
              {rfKe5Results && (
                <div style={{
                  backgroundColor: '#2b2b2b',
                  padding: '25px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
                  border: '1px solid #4a4a4a',
                }}>
                  <h4 style={{
                    color: '#00e676',
                    marginBottom: '15px',
                    fontSize: '1.6em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <FaChartBar style={{ fontSize: '1.3em' }} /> Random Forest Model
                  </h4>
                  <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>
                    <strong>Prediksi:</strong>{' '}
                    <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>
                      {rfKe5Results.prediction !== undefined ? rfKe5Results.prediction.toFixed(2) : 'N/A'}
                    </span>
                  </p>

                  {/* Persentase Kesalahan RF Ke5 */}
                  {nilaiAktual && nilaiAktual !== '' && rfKe5Results.prediction !== undefined && (
                    <div style={{
                      backgroundColor: '#3a3a3a',
                      padding: '12px 15px',
                      borderRadius: '8px',
                      marginBottom: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#e0e0e0',
                      fontSize: '1em',
                      borderLeft: '4px solid #ff8c00',
                    }}>
                      <FaExclamationTriangle style={{ color: '#ff8c00', fontSize: '1.1em' }} />
                      <strong style={{ color: '#ffcc00' }}>Kesalahan Prediksi:</strong> {calculateErrorPercentage(rfKe5Results.prediction, parseFloat(nilaiAktual))?.toFixed(2) || 'N/A'}%
                    </div>
                  )}
                  <h4 style={{ color: '#bbbbbb', marginBottom: '10px', fontSize: '1.3em' }}>Metrik Evaluasi:</h4>
                  {renderMetrics(rfKe5Results.metrics)}
                </div>
              )}

              {dtKe5Results && (
                <div style={{
                  backgroundColor: '#2b2b2b',
                  padding: '25px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
                  border: '1px solid #4a4a4a',
                }}>
                  <h4 style={{
                    color: '#00e676',
                    marginBottom: '15px',
                    fontSize: '1.6em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <FaChartBar style={{ fontSize: '1.3em' }} /> Decision Tree Model
                  </h4>
                  <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>
                    <strong>Prediksi:</strong>{' '}
                    <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>
                      {dtKe5Results.prediction !== undefined ? dtKe5Results.prediction.toFixed(2) : 'N/A'}
                    </span>
                  </p>

                  {/* Persentase Kesalahan DT Ke5 */}
                  {nilaiAktual && nilaiAktual !== '' && dtKe5Results.prediction !== undefined && (
                    <div style={{
                      backgroundColor: '#3a3a3a',
                      padding: '12px 15px',
                      borderRadius: '8px',
                      marginBottom: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#e0e0e0',
                      fontSize: '1em',
                      borderLeft: '4px solid #ff8c00',
                    }}>
                      <FaExclamationTriangle style={{ color: '#ff8c00', fontSize: '1.1em' }} />
                      <strong style={{ color: '#ffcc00' }}>Kesalahan Prediksi:</strong> {calculateErrorPercentage(dtKe5Results.prediction, parseFloat(nilaiAktual))?.toFixed(2) || 'N/A'}%
                    </div>
                  )}
                  <h4 style={{ color: '#bbbbbb', marginBottom: '10px', fontSize: '1.3em' }}>Metrik Evaluasi:</h4>
                  {renderMetrics(dtKe5Results.metrics)}
                </div>
              )}

              {/* Eksperimen 2 Results (now Baseline Models) */}
              <h3 style={{
                color: '#e0e0e0', // Warna yang lebih netral
                marginBottom: '10px',
                fontSize: '1.8em',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '2px solid #555', // Garis pemisah
                paddingBottom: '10px',
                marginTop: '30px', // Margin atas untuk memisahkan eksperimen
              }}>
                <FaFlask style={{ fontSize: '1.3em', color: '#82b1ff' }} /> Hasil Model Baseline
              </h3>
              {rfBaselineResults && ( // Changed variable name
                <div style={{
                  backgroundColor: '#2b2b2b',
                  padding: '25px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
                  border: '1px solid #4a4a4a',
                }}>
                  <h4 style={{
                    color: '#00e676',
                    marginBottom: '15px',
                    fontSize: '1.6em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <FaChartBar style={{ fontSize: '1.3em' }} /> Random Forest Model
                  </h4>
                  <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>
                    <strong>Prediksi:</strong>{' '}
                    <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>
                      {rfBaselineResults.prediction !== undefined ? rfBaselineResults.prediction.toFixed(2) : 'N/A'}
                    </span>
                  </p>

                  {/* Persentase Kesalahan RF Baseline */}
                  {nilaiAktual && nilaiAktual !== '' && rfBaselineResults.prediction !== undefined && (
                    <div style={{
                      backgroundColor: '#3a3a3a',
                      padding: '12px 15px',
                      borderRadius: '8px',
                      marginBottom: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#e0e0e0',
                      fontSize: '1em',
                      borderLeft: '4px solid #ff8c00',
                    }}>
                      <FaExclamationTriangle style={{ color: '#ff8c00', fontSize: '1.1em' }} />
                      <strong style={{ color: '#ffcc00' }}>Kesalahan Prediksi:</strong> {calculateErrorPercentage(rfBaselineResults.prediction, parseFloat(nilaiAktual))?.toFixed(2) || 'N/A'}%
                    </div>
                  )}
                  <h4 style={{ color: '#bbbbbb', marginBottom: '10px', fontSize: '1.3em' }}>Metrik Evaluasi:</h4>
                  {renderMetrics(rfBaselineResults.metrics)}
                </div>
              )}

              {dtBaselineResults && (
                <div style={{
                  backgroundColor: '#2b2b2b',
                  padding: '25px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
                  border: '1px solid #4a4a4a',
                }}>
                  <h4 style={{
                    color: '#00e676',
                    marginBottom: '15px',
                    fontSize: '1.6em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <FaChartBar style={{ fontSize: '1.3em' }} /> Decision Tree Model
                  </h4>
                  <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>
                    <strong>Prediksi:</strong>{' '}
                    <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>
                      {dtBaselineResults.prediction !== undefined ? dtBaselineResults.prediction.toFixed(2) : 'N/A'}
                    </span>
                  </p>

                  {/* Persentase Kesalahan DT Baseline */}
                  {nilaiAktual && nilaiAktual !== '' && dtBaselineResults.prediction !== undefined && (
                    <div style={{
                      backgroundColor: '#3a3a3a',
                      padding: '12px 15px',
                      borderRadius: '8px',
                      marginBottom: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#e0e0e0',
                      fontSize: '1em',
                      borderLeft: '4px solid #ff8c00',
                    }}>
                      <FaExclamationTriangle style={{ color: '#ff8c00', fontSize: '1.1em' }} />
                      <strong style={{ color: '#ffcc00' }}>Kesalahan Prediksi:</strong> {calculateErrorPercentage(dtBaselineResults.prediction, parseFloat(nilaiAktual))?.toFixed(2) || 'N/A'}%
                    </div>
                  )}
                  <h4 style={{ color: '#bbbbbb', marginBottom: '10px', fontSize: '1.3em' }}>Metrik Evaluasi:</h4>
                  {renderMetrics(dtBaselineResults.metrics)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}