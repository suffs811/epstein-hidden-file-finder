import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import Papa from 'papaparse'
import sampleCsvUrl from '../../output/exists_urls.csv?url'
import githubLogo from './assets/github.png'
import './App.css'

const EMPTY_SORT = {
  columnName: '',
  direction: 'asc',
}

const CSV_EXTENSIONS = ['.csv']
const CSV_MIME_TYPES = ['text/csv', 'application/csv', 'application/vnd.ms-excel']

function createEmptyFilters(columns) {
  return Object.fromEntries(columns.map((columnName) => [columnName, '']))
}

function normalizeCellValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

function getComparableValue(value) {
  const normalizedValue = normalizeCellValue(value)

  if (normalizedValue === '') {
    return { kind: 'empty', value: normalizedValue }
  }

  const numericValue = Number(normalizedValue)

  if (!Number.isNaN(numericValue)) {
    return { kind: 'number', value: numericValue }
  }

  const timestampValue = Date.parse(normalizedValue)

  if (!Number.isNaN(timestampValue) && normalizedValue.includes('-')) {
    return { kind: 'date', value: timestampValue }
  }

  return { kind: 'text', value: normalizedValue.toLowerCase() }
}

function compareCells(leftValue, rightValue) {
  const leftComparable = getComparableValue(leftValue)
  const rightComparable = getComparableValue(rightValue)

  if (leftComparable.kind === 'empty' && rightComparable.kind !== 'empty') {
    return 1
  }

  if (rightComparable.kind === 'empty' && leftComparable.kind !== 'empty') {
    return -1
  }

  if (leftComparable.kind === rightComparable.kind) {
    if (leftComparable.kind === 'text') {
      return normalizeCellValue(leftValue).localeCompare(normalizeCellValue(rightValue), undefined, {
        sensitivity: 'base',
        numeric: true,
      })
    }

    if (leftComparable.value < rightComparable.value) {
      return -1
    }

    if (leftComparable.value > rightComparable.value) {
      return 1
    }

    return 0
  }

  return normalizeCellValue(leftValue).localeCompare(normalizeCellValue(rightValue), undefined, {
    sensitivity: 'base',
    numeric: true,
  })
}

function buildRows(parsedRows, columns, fileName) {
  return parsedRows.flatMap((parsedRow, rowIndex) => {
    const values = Object.fromEntries(
      columns.map((columnName) => [columnName, parsedRow[columnName] ?? '']),
    )
    const hasValues = columns.some((columnName) => normalizeCellValue(values[columnName]) !== '')

    if (!hasValues) {
      return []
    }

    return [
      {
        rowKey: `${fileName}-${rowIndex}`,
        sourceIndex: rowIndex,
        values,
      },
    ]
  })
}

function parseCsvSource(source) {
  return new Promise((resolve, reject) => {
    Papa.parse(source, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const meaningfulErrors = results.errors.filter(
          (parseError) => parseError.code !== 'UndetectableDelimiter',
        )

        if (meaningfulErrors.length > 0) {
          reject(new Error(meaningfulErrors[0].message))
          return
        }

        resolve(results)
      },
      error: (error) => reject(error),
    })
  })
}

function applyParsedResultsToState({
  parsedResults,
  nextFileName,
  setColumns,
  setRows,
  setFileName,
  setSearchQuery,
  setColumnFilters,
  setSortConfig,
  setErrorMessage,
  setIsLoading,
}) {
  const nextColumns = parsedResults.meta.fields?.filter(Boolean) ?? []

  if (nextColumns.length === 0) {
    setErrorMessage('This CSV file does not contain a header row.')
    setIsLoading(false)
    return
  }

  const nextRows = buildRows(parsedResults.data, nextColumns, nextFileName)

  startTransition(() => {
    setColumns(nextColumns)
    setRows(nextRows)
    setFileName(nextFileName)
    setSearchQuery('')
    setColumnFilters(createEmptyFilters(nextColumns))
    setSortConfig({ ...EMPTY_SORT })
    setErrorMessage('')
    setIsLoading(false)
  })
}

function applyLoadError(error, setErrorMessage, setIsLoading) {
  setErrorMessage(error instanceof Error ? error.message : 'Unable to read the CSV file.')
  setIsLoading(false)
}

function createDownloadFileName(fileName, hasActiveControls) {
  const baseName = fileName.toLowerCase().endsWith('.csv') ? fileName.slice(0, -4) : fileName

  return `${baseName}${hasActiveControls ? '-view' : '-export'}.csv`
}

function App() {
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState('exists_urls.csv')
  const [searchQuery, setSearchQuery] = useState('')
  const [columnFilters, setColumnFilters] = useState({})
  const [sortConfig, setSortConfig] = useState({ ...EMPTY_SORT })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const deferredSearchQuery = useDeferredValue(searchQuery)
  const deferredColumnFilters = useDeferredValue(columnFilters)

  useEffect(() => {
    let isCancelled = false

    async function loadSampleCsv() {
      setIsLoading(true)

      try {
        const response = await fetch(sampleCsvUrl)

        if (!response.ok) {
          throw new Error('Unable to load the bundled sample CSV file.')
        }

        const csvText = await response.text()
        const parsedResults = await parseCsvSource(csvText)

        if (!isCancelled) {
          applyParsedResultsToState({
            parsedResults,
            nextFileName: 'exists_urls.csv',
            setColumns,
            setRows,
            setFileName,
            setSearchQuery,
            setColumnFilters,
            setSortConfig,
            setErrorMessage,
            setIsLoading,
          })
        }
      } catch (error) {
        if (!isCancelled) {
          applyLoadError(error, setErrorMessage, setIsLoading)
        }
      }
    }

    loadSampleCsv()

    return () => {
      isCancelled = true
    }
  }, [])

  function handleFilterChange(columnName, value) {
    setColumnFilters((currentFilters) => ({
      ...currentFilters,
      [columnName]: value,
    }))
  }

  function handleSortChange(columnName) {
    setSortConfig((currentSort) => {
      if (currentSort.columnName === columnName) {
        return {
          columnName,
          direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
        }
      }

      return {
        columnName,
        direction: 'asc',
      }
    })
  }

  function resetTableControls() {
    setSearchQuery('')
    setColumnFilters(createEmptyFilters(columns))
    setSortConfig({ ...EMPTY_SORT })
  }

  function handleDownloadCsv() {
    if (columns.length === 0 || visibleRows.length === 0) {
      return
    }

    const csvRows = visibleRows.map((row) => row.values)
    const csvText = Papa.unparse({
      fields: columns,
      data: csvRows,
    })
    const csvBlob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
    const downloadUrl = URL.createObjectURL(csvBlob)
    const downloadLink = document.createElement('a')

    downloadLink.href = downloadUrl
    downloadLink.download = createDownloadFileName(fileName, hasActiveControls)
    document.body.append(downloadLink)
    downloadLink.click()
    downloadLink.remove()
    URL.revokeObjectURL(downloadUrl)
  }

  function getSortIndicator(columnName) {
    if (sortConfig.columnName !== columnName) {
      return '↕'
    }

    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  function getAriaSort(columnName) {
    if (sortConfig.columnName !== columnName) {
      return 'none'
    }

    return sortConfig.direction === 'asc' ? 'ascending' : 'descending'
  }

  const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase()
  const activeColumnFilters = Object.entries(deferredColumnFilters).filter(([, filterValue]) => {
    return filterValue.trim() !== ''
  })
  const filteredRows = rows.filter((row) => {
    const matchesColumnFilters = activeColumnFilters.every(([columnName, filterValue]) => {
      return normalizeCellValue(row.values[columnName])
        .toLowerCase()
        .includes(filterValue.trim().toLowerCase())
    })

    if (!matchesColumnFilters) {
      return false
    }

    if (!normalizedSearchQuery) {
      return true
    }

    return columns.some((columnName) => {
      return normalizeCellValue(row.values[columnName])
        .toLowerCase()
        .includes(normalizedSearchQuery)
    })
  })
  const visibleRows = sortConfig.columnName
    ? [...filteredRows].sort((leftRow, rightRow) => {
        const comparison = compareCells(
          leftRow.values[sortConfig.columnName],
          rightRow.values[sortConfig.columnName],
        )

        if (comparison !== 0) {
          return sortConfig.direction === 'asc' ? comparison : -comparison
        }

        return leftRow.sourceIndex - rightRow.sourceIndex
      })
    : filteredRows
  const hasActiveControls =
    searchQuery.trim() !== '' ||
    Object.values(columnFilters).some((filterValue) => filterValue.trim() !== '') ||
    sortConfig.columnName !== ''

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">CSV Workbench</p>
          <h1>Epstein Hidden Files Table</h1>
          <p className="hero-copy">
            Nearly 4,000 files in the Epstein dataset were uploaded as PDFs when they were actually videos, images, and other files. This table shows you the correct files with the correct extension.
          </p>
        </div>

        <div className="toolbar">
          <button
            className="button button-secondary"
            type="button"
            onClick={handleDownloadCsv}
            disabled={isLoading || visibleRows.length === 0}
          >
            Download CSV
          </button>
          <button
            className="button button-ghost"
            type="button"
            onClick={resetTableControls}
            disabled={!hasActiveControls}
          >
            Reset view
          </button>
          <a
            className="button button-secondary github-link"
            href="https://github.com/suffs811/epstein-hidden-file-finder"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={githubLogo} alt="GitHub" />
            <span>GitHub</span>
          </a>
        </div>
      </section>

      <section className="control-panel">
        <div className="search-group">
          <label htmlFor="global-search" value='Search every cell'></label>
          <input
            id="global-search"
            className="search-input"
            type="search"
            placeholder="Find any text in the dataset"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="status-grid">
          <article className="status-card">
            <span className="status-label">Loaded file</span>
            <strong className="status-value">{fileName}</strong>
          </article>
          <article className="status-card">
            <span className="status-label">Rows shown</span>
            <strong className="status-value">{visibleRows.length}</strong>
          </article>
          <article className="status-card">
            <span className="status-label">Total rows</span>
            <strong className="status-value">{rows.length}</strong>
          </article>
          <article className="status-card">
            <span className="status-label">Columns</span>
            <strong className="status-value">{columns.length}</strong>
          </article>
        </div>
      </section>

      {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

      {isLoading ? (
        <section className="empty-state">
          <h2>Loading CSV data</h2>
          <p>The table will appear as soon as the file has been parsed.</p>
        </section>
      ) : columns.length === 0 ? (
        <section className="empty-state">
          <h2>No data loaded</h2>
          <p>Upload a CSV file or reload the bundled sample to populate the table.</p>
        </section>
      ) : (
        <section className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {columns.map((columnName) => (
                    <th key={columnName} scope="col" aria-sort={getAriaSort(columnName)}>
                      <button
                        className="sort-button"
                        type="button"
                        onClick={() => handleSortChange(columnName)}
                      >
                        <span>{columnName}</span>
                        <span className="sort-indicator">{getSortIndicator(columnName)}</span>
                      </button>
                    </th>
                  ))}
                </tr>
                <tr className="filters-row">
                  {columns.map((columnName) => (
                    <th key={`${columnName}-filter`} scope="col">
                      <label className="sr-only" htmlFor={`filter-${columnName}`}>
                        Filter {columnName}
                      </label>
                      <input
                        id={`filter-${columnName}`}
                        type="text"
                        placeholder={`Filter ${columnName}`}
                        value={columnFilters[columnName] ?? ''}
                        onChange={(event) => handleFilterChange(columnName, event.target.value)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.length > 0 ? (
                  visibleRows.map((row) => (
                    <tr key={row.rowKey}>
                      {columns.map((columnName) => {
                        const cellValue = normalizeCellValue(row.values[columnName])

                        return (
                          <td key={`${row.rowKey}-${columnName}`}>
                            {cellValue === '' ? <span className="cell-empty">—</span> : cellValue}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                ) : (
                  <tr className="no-results-row">
                    <td colSpan={columns.length}>
                      No rows match the current search and filter settings.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
