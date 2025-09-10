package main

import (
	"encoding/json"
	"fmt"
	"github.com/sergi/go-diff/diffmatchpatch"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type ComparisonRequest struct {
	FilePath   string `json:"file_path"`
	FolderPath string `json:"folder_path"`
}

type ComparisonResult struct {
	FileName   string  `json:"file_name"`
	Plagiarism float64 `json:"plagiarism"`
}

func normalizeLines(text string) []string {
	lines := strings.Split(text, "\n")
	var normalized []string
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			normalized = append(normalized, trimmed)
		}
	}
	return normalized
}

func calculateSimilarity(text1, text2 string) float64 {
	norm1 := strings.Join(normalizeLines(text1), "\n")
	norm2 := strings.Join(normalizeLines(text2), "\n")

	if norm1 == norm2 && len(norm1) > 0 {
		return 100.0
	}

	dmp := diffmatchpatch.New()
	diffs := dmp.DiffMain(norm1, norm2, false)

	equalChars := 0
	totalChars := len(norm2)

	for _, diff := range diffs {
		if diff.Type == diffmatchpatch.DiffEqual {
			equalChars += len(diff.Text)
		}
	}

	if totalChars == 0 {
		return 0.0
	}
	percent := float64(equalChars) / float64(totalChars) * 100
	if percent < 0 {
		percent = 0
	}
	return percent
}

func compareHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Write([]byte(`{"error":"POST required"}`))
		return
	}

	var req ComparisonRequest
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	// Load input file
	sourceData, err := os.ReadFile(req.FilePath)
	if err != nil {
		http.Error(w, fmt.Sprintf("unable to read file: %v", err), http.StatusBadRequest)
		return
	}
	sourceContent := string(sourceData)
	sourceBase := filepath.Base(req.FilePath)

	// List files in folder
	entries, err := ioutil.ReadDir(req.FolderPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("unable to read folder: %v", err), http.StatusBadRequest)
		return
	}

	var results []ComparisonResult
	for _, entry := range entries {
		if !entry.Mode().IsRegular() {
			continue
		}
		otherPath := filepath.Join(req.FolderPath, entry.Name())
		if entry.Name() == sourceBase {
			results = append(results, ComparisonResult{FileName: entry.Name(), Plagiarism: 0})
			continue // skip self-comparison
		}

		otherContentBytes, err := os.ReadFile(otherPath)
		if err != nil {
			results = append(results, ComparisonResult{FileName: entry.Name(), Plagiarism: 0})
			continue
		}

		match := calculateSimilarity(sourceContent, string(otherContentBytes))
		results = append(results, ComparisonResult{FileName: entry.Name(), Plagiarism: match})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func main() {
	http.HandleFunc("/compare", compareHandler)
	fmt.Println("Server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
