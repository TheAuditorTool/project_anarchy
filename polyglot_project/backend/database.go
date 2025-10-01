// ERROR 273: Go database layer in polyglot project
// Multi-language coordination complexity

package main

import "fmt"

func connectDB() {
    fmt.Println("Go database connection")
}

func main() {
    connectDB()
}